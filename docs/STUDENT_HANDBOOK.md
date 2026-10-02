# Student handbook

Welcome to the ShopSphere security lab. Your job is to think like an attacker to
become a better defender.

## Your environment
- **Target:** the ShopSphere application at the URL your instructor provides.
- **Scope:** endpoints under `/labs/*` only. The storefront, admin portal, and
  instructor console are **out of scope** and are intentionally hardened.
- **Accounts:** use the synthetic accounts provided (e.g. `avery@example.test` /
  `Customer!Pass1`). Never use real data.

## Tools provided
- **Security Lab** (`/labs`): the list of target features. Business context only —
  no hints or solutions.
- **Request Inspector** (`/labs/inspector`): send bounded `GET/POST/PATCH/DELETE`
  requests to `/labs/*` and `/api/*` and inspect status, headers, and body.
- **Finding Notebook** (`/labs/findings`): draft and submit findings to your
  instructor.

## How to work a target
1. Explore the feature as a normal user. Note every input and identifier.
2. Form a hypothesis ("what if this `id` isn't checked for ownership?").
3. Test it with the Request Inspector or your own proxy/browser tools.
4. Confirm impact using **synthetic** accounts only.
5. Write it up in the Finding Notebook: title, endpoint, category, severity,
   reproduction steps, impact, and a suggested fix.

## Writing a good finding
- **Reproducible:** exact request(s) and expected vs. actual behaviour.
- **Scoped:** which account/role, which object.
- **Impactful:** what a real attacker gains.
- **Actionable:** a concrete remediation.

Some labs hide a synthetic flag like `shopsphere{...}` as proof of exploitation —
include it as evidence when you find one.
