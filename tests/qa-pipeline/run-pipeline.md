# QA Pipeline — Ralph Loop Driver

You are the pipeline controller for PrivacyQuest QA automation. You orchestrate three types of agents in a loop: QA Orchestrator (finds bugs), Fix Agents (fix bugs), and Sentinel (reviews fixes). You run until quality targets are met.

## SETUP (first iteration only)

```bash
# Ensure clean state
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Create pipeline directory if needed
mkdir -p tests/qa-pipeline

# Initialize fix log
echo '[]' > tests/qa-pipeline/fix-log.json 2>/dev/null || true

# Verify TypeScript compiles
npx tsc --noEmit 2>&1 | head -10
```

## EACH ITERATION

### Phase 1: QA Orchestrator

Spawn a QA orchestrator subagent:

```
Launch Agent with prompt:
"Read tests/qa-pipeline/orchestrator-prompt.md and execute it as the QA Orchestrator.
This is iteration N of the QA pipeline.

Previous iteration results (if any): {summary from last iteration}

Execute Steps 1-7 of the orchestrator prompt:
- Build check
- Run automated tests
- Capture and evaluate screenshots
- Cascade analysis
- Write report to tests/qa-pipeline/report.json
- Plan fix waves

Do NOT dispatch fix agents — return the report and wave plan to me."
```

Wait for the orchestrator to complete. Read `tests/qa-pipeline/report.json`.

### Phase 2: Check Termination

Read the report. The pipeline has TWO phases of work:

**Phase A — Bug fixing (BLOCKER/CRITICAL/MAJOR/MINOR/POLISH):**
These are rule violations from the polish audit. They must be fixed.

**Phase B — Design improvements (DESIGN severity):**
These are game quality upgrades from the design rating. They make the game better.

Phase A runs first. Phase B only starts when Phase A is clean.

**Termination conditions:**

1. **STOP if**: Zero BLOCKER/CRITICAL bugs AND all tests passing AND zero FAIL rules in polish_audit AND all design_ratings >= 8 (or scores didn't improve after last design wave — plateau reached)
2. **STOP if**: This is iteration 5+ (hard limit — prevent infinite loops)
3. **STOP if**: Circuit breaker — a bug has been attempted 3 times (check fix-log.json for repeated bug_ids)
4. **CONTINUE (Phase A) if**: Any BLOCKER or CRITICAL remains, or any POLISH_STANDARD rule has status FAIL
5. **CONTINUE (Phase B) if**: Phase A is clean but any design_rating < 8 with actionable improvements

If stopping:
```
<promise>QA pipeline complete — all tests passing, no blockers or criticals</promise>
```

### Phase 3: Dispatch Fix Agents (Wave by Wave)

For each wave in the report's `wave_plan`:

#### 3a. Spawn Fix Agent(s)

For each bug in the wave, spawn a fix agent:

```
Launch Agent with prompt:
"Read tests/qa-pipeline/fix-agent-prompt.md and execute it as the Fix Agent.

Your bug ticket:
{paste the full bug JSON from report.json}

Steps:
1. Read tests/qa-pipeline/codebase-context.txt for codebase context
2. Read the affected files listed in your ticket
3. Write a 1-paragraph fix plan
4. Implement the minimum fix
5. Run the verification test: {specific test command}
6. Append results to tests/qa-pipeline/fix-log.json
7. Commit if successful

If you cannot fix it in 2 attempts, exit with result: failure or needs_design_review."
```

**Parallel dispatch**: If the wave says `"parallel": true`, spawn all fix agents in the wave simultaneously using multiple Agent tool calls in ONE message. Only do this when bugs touch different files.

**Serial dispatch**: If `"parallel": false`, spawn one fix agent at a time, waiting for each to complete before the next.

#### 3b. Sentinel Review

After EACH fix agent completes and commits, spawn a sentinel:

```
Launch Agent with prompt:
"Read tests/qa-pipeline/sentinel-prompt.md and execute it as the Sentinel.
Review the last commit for bug {BUG-ID}.
Run: git diff HEAD~1 --unified=5 && git diff HEAD~1 --stat
Read tests/qa-pipeline/fix-log.json for the fix plan.
Render your verdict: APPROVE, RE-FIX, or HUMAN_REVIEW."
```

**If APPROVE**: Continue to next bug/wave.
**If RE-FIX**: Revert the commit (`git revert HEAD --no-edit`), then re-dispatch the fix agent with the sentinel's instructions appended to the bug ticket.
**If HUMAN_REVIEW**: Log the issue, skip this bug, continue to next.

#### 3c. Regression Check (after each wave)

After all bugs in a wave are fixed and approved:

```bash
npx playwright test tests/progression/ --workers=1 --reporter=list 2>&1 | tail -20
```

If any previously-passing test now fails:
1. Identify which commit caused the regression
2. Revert it: `git revert {commit_sha} --no-edit`
3. Re-queue the bug with a note about what approach failed

### Phase 4: Re-audit

After all waves complete:

```bash
npx playwright test tests/visual-qa.spec.ts --workers=1 --reporter=list 2>&1 | tail -15
```

Read new screenshots. Re-run the POLISH_STANDARD audit (Step 4 from orchestrator) for any rules that were FAIL in the previous iteration. Update `tests/qa-pipeline/report.json` with new rule statuses. Track which rules flipped from FAIL to PASS.

### Phase 5: Loop

Go back to Phase 1 (QA Orchestrator) for the next iteration.

---

## STATE TRACKING

The pipeline maintains state across iterations via files:

| File | Purpose | Updated by |
|------|---------|------------|
| `tests/qa-pipeline/report.json` | Current bug report + polish audit | QA Orchestrator |
| `tests/qa-pipeline/fix-log.json` | Array of all fix attempts | Fix Agents |
| `tests/qa-pipeline/test-results.json` | Playwright JSON output | Playwright (via config) |
| `screenshots/*.png` | Visual regression captures | Playwright visual tests |

## CIRCUIT BREAKERS

1. **Max iterations**: 5. After 5 iterations, stop regardless of remaining bugs.
2. **Repeated failure**: If the same `bug_id` appears 3+ times in `fix-log.json` with result `failure`, skip it and log for human review.
3. **Regression cascade**: If reverting a fix causes another fix to also regress, stop the current iteration and re-run from Phase 1.
4. **Token awareness**: If you notice agents returning truncated or confused results, reduce the wave size to 1 bug at a time.

## COMPLETION CRITERIA

The pipeline is complete when ALL of:
- [ ] All Playwright tests pass (excluding intentionally skipped breach tests)
- [ ] No BLOCKER or CRITICAL bugs in report.json
- [ ] All POLISH_STANDARD rules pass (no FAIL status in polish_audit), excluding rules where the only remaining violations are flagged `requires_design_review`
- [ ] No MAJOR bugs remaining that are auto-fixable (MINOR/POLISH acceptable, HUMAN_REVIEW acceptable)
- [ ] All room/hallway design ratings >= 8, OR design scores plateaued (didn't improve after last design wave)

Or when a hard stop is reached (iteration limit, circuit breaker).

<promise>QA pipeline complete — all tests passing, no blockers or criticals</promise>
