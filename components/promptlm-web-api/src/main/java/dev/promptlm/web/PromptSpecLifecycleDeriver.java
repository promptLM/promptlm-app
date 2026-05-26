/*
 * Copyright 2025 promptLM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package dev.promptlm.web;

import dev.promptlm.domain.AppContext;
import dev.promptlm.domain.projectspec.ProjectSpec;
import dev.promptlm.domain.promptspec.PromptSpec;
import dev.promptlm.domain.promptspec.PromptSpecLifecycleState;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.errors.MissingObjectException;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.Ref;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;

/**
 * Derives the {@link PromptSpecLifecycleState} of a {@link PromptSpec} from
 * storage truth — i.e. by comparing on-disk YAML to the active project's Git
 * HEAD and to the corresponding {@code origin/<branch>} ref.
 *
 * <p>Returns {@code null} when the state cannot be derived (no active project,
 * no repo dir, no HEAD, etc.). Callers should treat {@code null} as "no
 * lifecycle information available" and surface the field as omitted in JSON
 * (which is the default behaviour because {@code PromptSpec.lifecycleState} is
 * {@code @JsonInclude(NON_NULL)}).
 *
 * <p>Never throws on I/O failures — diagnostic info is logged at WARN, and
 * derivation falls through to {@code null}. The lifecycle field is decorative
 * metadata for the UI; a Git read hiccup must not break the {@code GET}.
 *
 * <p>Issue #184 extends the deriver to also surface the Git short SHA of the
 * commit that currently carries the spec content (HEAD when the working tree
 * matches HEAD). The UI uses this as the fallback revision identifier when no
 * release tag is present in the spec extensions.
 *
 * @see <a href="https://github.com/promptLM/promptlm-app/issues/189">Issue #189</a>
 * @see <a href="https://github.com/promptLM/promptlm-app/issues/184">Issue #184</a>
 */
@Component
class PromptSpecLifecycleDeriver {

    /**
     * Result of a single derivation pass. {@link #state} captures the
     * lifecycle classification; {@link #headShortSha} carries the 7-char
     * abbreviation of HEAD when the working tree matches a commit (i.e. for
     * {@link PromptSpecLifecycleState#COMMITTED} and
     * {@link PromptSpecLifecycleState#PUSHED}). For
     * {@link PromptSpecLifecycleState#SAVED} the SHA is {@code null} because
     * the on-disk content is not represented by any commit yet.
     */
    record Result(PromptSpecLifecycleState state, String headShortSha) {

        static final Result EMPTY = new Result(null, null);

        static Result onlyState(PromptSpecLifecycleState state) {
            return new Result(state, null);
        }
    }

    private static final Logger log = LoggerFactory.getLogger(PromptSpecLifecycleDeriver.class);
    private static final int SHORT_SHA_LENGTH = 7;

    private final AppContext appContext;

    PromptSpecLifecycleDeriver(AppContext appContext) {
        this.appContext = appContext;
    }

    /**
     * Returns the lifecycle state of the given spec, or {@code null} when it
     * cannot be derived.
     *
     * <p>Retained as a convenience for callers that only care about the state
     * classification. Prefer {@link #deriveResult(PromptSpec)} when the short
     * SHA is also useful.
     */
    PromptSpecLifecycleState derive(PromptSpec spec) {
        return deriveResult(spec).state();
    }

    /**
     * Returns the full derivation result — state plus optional short SHA.
     */
    Result deriveResult(PromptSpec spec) {
        if (spec == null) {
            return Result.EMPTY;
        }
        Path repoDir = resolveRepoDir();
        if (repoDir == null) {
            return Result.EMPTY;
        }
        Path specPath = resolveSpecPath(spec, repoDir);
        if (specPath == null) {
            return Result.EMPTY;
        }
        try (Git git = Git.open(repoDir.toFile())) {
            Repository repo = git.getRepository();
            String relativeGitPath = toGitPath(repoDir, specPath);
            if (relativeGitPath == null) {
                return Result.EMPTY;
            }

            byte[] workingTreeContent = Files.exists(specPath)
                    ? Files.readAllBytes(specPath)
                    : null;
            byte[] headContent = readBlobAtHead(repo, relativeGitPath);

            if (!Arrays.equals(workingTreeContent, headContent)) {
                // Working tree differs from HEAD (or HEAD has no blob yet for
                // this path). The change has been "saved" to disk but is not
                // captured by a commit yet. No short SHA — the on-disk content
                // is not represented by any commit.
                return Result.onlyState(PromptSpecLifecycleState.SAVED);
            }

            // Working tree matches HEAD; HEAD's short SHA identifies the
            // current revision regardless of pushed-or-not.
            String shortSha = shortShaOfHead(repo);
            if (isHeadReachableFromOrigin(repo)) {
                return new Result(PromptSpecLifecycleState.PUSHED, shortSha);
            }
            return new Result(PromptSpecLifecycleState.COMMITTED, shortSha);
        } catch (IOException | RuntimeException e) {
            log.warn("Failed to derive lifecycle state for prompt {}/{} at {}: {}",
                    spec.getGroup(), spec.getName(), specPath, e.toString());
            return Result.EMPTY;
        }
    }

    private Path resolveRepoDir() {
        ProjectSpec activeProject = appContext.getActiveProject();
        if (activeProject == null) {
            return null;
        }
        Path repoDir = activeProject.getRepoDir();
        if (repoDir == null) {
            return null;
        }
        Path normalized = repoDir.toAbsolutePath().normalize();
        if (!Files.isDirectory(normalized)) {
            return null;
        }
        return normalized;
    }

    private Path resolveSpecPath(PromptSpec spec, Path repoDir) {
        Path specPath = spec.getPath();
        if (specPath == null) {
            return null;
        }
        if (specPath.isAbsolute()) {
            return specPath.normalize();
        }
        return repoDir.resolve(specPath).normalize();
    }

    private String toGitPath(Path repoDir, Path specPath) {
        Path relative;
        try {
            relative = repoDir.relativize(specPath);
        } catch (IllegalArgumentException ex) {
            // specPath is not under repoDir — caller should not have passed it.
            return null;
        }
        return relative.toString().replace('\\', '/');
    }

    private byte[] readBlobAtHead(Repository repo, String relativeGitPath) throws IOException {
        ObjectId headId = repo.resolve("HEAD^{tree}");
        if (headId == null) {
            return null;
        }
        try (RevWalk walk = new RevWalk(repo);
             TreeWalk treeWalk = TreeWalk.forPath(repo, relativeGitPath, headId)) {
            if (treeWalk == null) {
                return null;
            }
            ObjectId blobId = treeWalk.getObjectId(0);
            if (blobId == null || blobId.equals(ObjectId.zeroId())) {
                return null;
            }
            try {
                return repo.open(blobId).getBytes();
            } catch (MissingObjectException missing) {
                return null;
            }
        }
    }

    /**
     * Returns {@code true} when the local HEAD commit is reachable from the
     * remote-tracking ref {@code refs/remotes/origin/<current-branch>}.
     *
     * <p>When no matching remote ref exists (e.g. the branch has never been
     * pushed, or the project has no remote configured), returns {@code false}
     * — the commit is "committed" but not "pushed".
     */
    private boolean isHeadReachableFromOrigin(Repository repo) throws IOException {
        ObjectId headId = repo.resolve("HEAD");
        if (headId == null) {
            return false;
        }
        String branch = repo.getBranch();
        if (branch == null) {
            return false;
        }
        Ref originRef = repo.findRef("refs/remotes/origin/" + branch);
        if (originRef == null) {
            return false;
        }
        ObjectId originId = originRef.getObjectId();
        if (originId == null) {
            return false;
        }
        try (RevWalk walk = new RevWalk(repo)) {
            RevCommit headCommit;
            RevCommit originCommit;
            try {
                headCommit = walk.parseCommit(headId);
                originCommit = walk.parseCommit(originId);
            } catch (MissingObjectException missing) {
                return false;
            }
            return walk.isMergedInto(headCommit, originCommit);
        }
    }

    /**
     * Returns the 7-char abbreviation of HEAD's commit SHA, or {@code null}
     * when HEAD cannot be resolved.
     */
    private String shortShaOfHead(Repository repo) throws IOException {
        ObjectId headId = repo.resolve("HEAD");
        if (headId == null) {
            return null;
        }
        String full = headId.getName();
        if (full.length() <= SHORT_SHA_LENGTH) {
            return full;
        }
        return full.substring(0, SHORT_SHA_LENGTH);
    }
}
