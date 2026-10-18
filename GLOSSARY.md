# Twenty

An open-source CRM. This fork adds Persian (`fa`) as a right-to-left locale alongside English.

## Language

### Localization

**App locale**:
A locale Twenty can run in, listed in `APP_LOCALES` in `twenty-shared`. Adding one there forces every consumer (catalogs, pickers, date locales) to handle it via exhaustive `Record` types.
_Avoid_: language, translation

**Source locale**:
The locale UI strings are authored in (`en`). Every other locale falls back to it per-string when a translation is absent.
_Avoid_: default locale, base language

**Locale availability**:
Whether a locale can be selected and has strings: an entry in `APP_LOCALES`, a catalog, a picker label. Distinct from whether the app is laid out correctly in it.
_Avoid_: locale support

**Direction correctness**:
Whether the layout actually mirrors in a right-to-left locale: CSS sides, icon geometry, popover placement, drag axes. A locale can be fully available and still directionally wrong.
_Avoid_: RTL support

**Auto-flip**:
Generating `[dir="rtl"]` CSS overrides at build time from the existing physical declarations, rather than migrating the source to logical properties. See ADR-0001.

**Translation glossary**:
The frozen English-to-Persian renderings of recurring domain nouns (`record` → `رکورد`) injected into every machine-translation batch, so separate translation runs agree on wording. Not to be confused with this file.

**Jalali display**:
Rendering dates in the Persian (Shamsi) calendar. Display only in this fork: date *input* and the picker grid remain Gregorian.
_Avoid_: Shamsi, Persian calendar

**Persian digits**:
The Persian-Indic numerals (`۰`–`۹`) substituted for ASCII digits at the display layer, after formatting.
_Avoid_: Arabic numerals, Eastern digits

### CRM demo

**Brand**:
One of the businesses the CRM serves: Gerami, Kifpool, Proopco. Each brand is its own tenant; its customers, leads and staff never see another brand's.
_Avoid_: tenant, company, app

**Customer**:
A person registered in a brand's app. Exists in the CRM from registration onward, identified by the app's own user id.
_Avoid_: user, client, account

**Lifecycle stage**:
Where a customer stands with a brand: registered, verified, first purchase, active, inactive, churned. Moved only by events the brand's app reports.

**Lead**:
A person who showed interest through a channel (Telegram, Instagram, call, form) but has not registered in the brand's app.
_Avoid_: prospect, opportunity

**Conversion**:
The app reporting that a lead's phone number registered, verified and made a first purchase. Decided by the app's events, never set by hand.

**Successful lead**:
A lead that converts within the attribution window after being assigned to a sales employee. The only thing commission is paid on.

**Commission**:
What a sales employee has earned for a successful lead. Calculated in the CRM; paid outside it.
_Avoid_: bonus, profit, payout

**Milestone**:
A notable thing a customer did in a brand's app (verified, first purchase, first withdrawal, funded), as reported by the app. The CRM keeps milestones, never individual trades.
_Avoid_: event, transaction, trade

**Lead assignee**:
The sales employee a lead was given to. Fixed once the lead converts, since commission follows it.
_Avoid_: owner, account manager

**Account manager**:
The employee who looks after a customer now. Starts as the converting lead's assignee and can be changed by a manager without affecting commission.
_Avoid_: owner, assignee

**Segment**:
The group a customer's recent behaviour puts them in, by rules each brand sets: Gerami ranks by recency, frequency and holdings (champions, loyal, at risk, hibernating, new); Kifpool by where money is heading (new, withdrawing, active trader, regular, holder, dormant).
_Avoid_: RFM segment, tier, value tier, level

**Influencer**:
A social media personality a brand pays to bring in users. Not a customer.
_Avoid_: partner, affiliate

**Partnership**:
A deal between a brand and an influencer to promote it, from first contact through a live campaign. Users it brings in are tracked against it; it pays no commission.
_Avoid_: opportunity, deal, campaign

**Holdings**:
What a customer keeps with a brand right now, as last reported by the app: for Gerami, grams of gold and silver plus the toman wallet; for Kifpool, the toman balance plus crypto valued in toman.
_Avoid_: portfolio, assets, balance

**Delivery request**:
A Gerami customer's request to receive physical gold or silver (coins or bars), tracked from request through delivery or cancellation. Its status is moved by the app; staff follow it up.
_Avoid_: order, shipment

**Corporate account**:
A Kifpool customer that is a registered company rather than an individual, represented by the person who holds the login. Follows the same lifecycle as any other customer.
_Avoid_: company, business customer

**KYC level**:
How far a Kifpool customer has been identity-checked (0, 1 or 2), each level unlocking more of the app. Reaching level 1 is what makes a Kifpool customer verified.
_Avoid_: tier, verification status

**KYC rejection**:
The app turning down a Kifpool customer's attempt to reach the next KYC level, with a reason. A customer can be rejected many times; it is a moment for staff to help, not a milestone.
_Avoid_: KYC failure

**Referrer**:
A Kifpool customer who brought in other customers with their own invite code. Their rewards are settled in the app, not the CRM.
_Avoid_: affiliate, influencer, partner
