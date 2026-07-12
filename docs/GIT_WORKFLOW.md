# 🌿 Git Workflow — TransitOps

Repo: https://github.com/vibhanshu000/tansist-ops

## Should we work on main? — NO.

`main` must stay **demo-ready at all times**. If everyone pushes to main, one broken commit kills the demo for all three of you. So we use branches.

## Branch model

```
main         ← protected · always working · only the final demo build lives here
 └── develop  ← integration branch · everyone opens PRs into this
      ├── feat/yash-foundation
      ├── feat/yash-vehicles
      ├── feat/ajay-trips
      ├── feat/ajay-maintenance
      ├── feat/vibhu-dashboard
      └── feat/vibhu-reports
```

- **main** — merge into it only from `develop`, and only when the app runs. Do this a few times during the day so you always have a safe fallback.
- **develop** — the shared integration branch. All feature PRs land here.
- **feat/<name>-<area>** — your personal work branches. Keep them small and focused.

## One-time setup (whoever creates the repo — Vibhu)

```bash
git clone https://github.com/vibhanshu000/tansist-ops.git
cd tansist-ops
# add the project files, then:
git add .
git commit -m "chore: initial scaffold"
git branch -M main
git push -u origin main
git checkout -b develop
git push -u origin develop
```

Then on GitHub: Settings → Branches → protect `main` (require PR before merge).

## Daily loop (everyone, every device)

```bash
# start of a task
git checkout develop
git pull                                   # get latest
git checkout -b feat/ajay-trips            # your branch

# ... work, commit often ...
git add .
git commit -m "feat(trips): dispatch sets vehicle+driver to On Trip"

# before pushing, sync with latest develop to avoid conflicts
git checkout develop
git pull
git checkout feat/ajay-trips
git merge develop                          # resolve conflicts locally
git push -u origin feat/ajay-trips
```

Then open a **Pull Request** `feat/ajay-trips → develop` on GitHub. Drop the PR link in the group chat.

## Commit message format (keep it clean)

```
feat(scope): what you added        feat(vehicles): unique reg number validation
fix(scope): what you fixed         fix(trips): cargo weight check off-by-one
chore(scope): setup/config         chore: add tailwind config
docs(scope): documentation         docs: update api contract
```

Scopes: `auth`, `vehicles`, `drivers`, `trips`, `maintenance`, `dashboard`, `fuel`, `reports`, `layout`.

## Avoiding conflicts (important — you're on 3 devices)

- **Stay in your own folders.** Ownership is in the root README. Conflicts happen when two people edit the same file.
- **Shared files** (`App.tsx` routing, `schema.prisma`, `app.ts`) are **Yash's**. If you need a route or a table, ask Yash or add only your isolated block and tell the group.
- **Pull `develop` often** (at least every 2 hours). Small frequent merges beat one giant painful merge at hour 7.
- Never `git push --force` to `develop` or `main`.

## Merge order at the end

1. Yash's foundation merged first (early — hour 1.5).
2. Ajay + Vibhu PRs into `develop` throughout the day.
3. Vibhu runs full workflow on `develop` → if green, PR `develop → main`.
4. Tag the demo build: `git tag demo-final && git push --tags`.

## If something breaks on develop
- Don't panic, don't force-push. Fix forward with a new commit, or revert the specific PR.
- `main` is your safety net — it always has a working version to demo.
