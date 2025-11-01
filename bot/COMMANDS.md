# ?? Command Reference Guide

Quick reference for all Balkan Government Bot commands.

## ??? Government Commands

### `/propose`
**Propose a new law**
- **Usage:** `/propose title:"Law Title" description:"What the law does"`
- **Permission:** President, Minister, or Council Member
- **Example:** `/propose title:"Military Expansion Act" description:"Increase military budget by 20%"`

### `/vote`
**Vote on a proposed law**
- **Usage:** `/vote law_id:1 vote:for`
- **Permission:** President, Minister, or Council Member
- **Choices:** `for` or `against`
- **Example:** `/vote law_id:5 vote:for`

### `/enact`
**Enact a law that passed voting**
- **Usage:** `/enact law_id:1`
- **Permission:** President or Minister only
- **Note:** Law must have ?50% approval to enact

### `/laws`
**View all laws**
- **Usage:** `/laws status:pending`
- **Permission:** Everyone
- **Choices:** `pending` or `enacted`

### `/borders`
**Control national borders**
- **Usage:** `/borders action:close border_type:military`
- **Permission:** President or Minister only
- **Actions:** `open` or `close`
- **Types:** `all`, `trade`, `military`, `immigration`
- **Example:** `/borders action:close border_type:all`

---

## ?? Military Commands

### `/declarewar`
**Declare war on another nation**
- **Usage:** `/declarewar nation:serbia`
- **Permission:** President or Minister only
- **Valid Nations:** serbia, croatia, bosnia, slovenia, montenegro, macedonia, albania, bulgaria, romania, greece
- **Example:** `/declarewar nation:serbia`

### `/mobilize`
**Mobilize military units**
- **Usage:** `/mobilize unit_type:infantry amount:500 location:border`
- **Permission:** President, Minister, or Military role
- **Example:** `/mobilize unit_type:tanks amount:50 location:Belgrade`

### `/deploy`
**Deploy troops to a location**
- **Usage:** `/deploy unit_type:infantry location:frontline`
- **Permission:** President, Minister, or Military role
- **Example:** `/deploy unit_type:artillery location:mountain_pass`

### `/defense`
**Set national defense status**
- **Usage:** `/defense status:high_alert`
- **Permission:** President or Minister only
- **Statuses:** 
  - `passive` - Peacetime
  - `active` - Standard readiness
  - `high_alert` - Elevated threat
  - `defcon1` - Maximum readiness
- **Example:** `/defense status:defcon1`

### `/endwar`
**End an active war**
- **Usage:** `/endwar war_id:1`
- **Permission:** President only
- **Example:** `/endwar war_id:3`

### `/wars`
**View all active wars**
- **Usage:** `/wars`
- **Permission:** Everyone
- **Shows:** War ID, target nation, who declared, when started

---

## ?? Diplomacy Commands

### `/alliance`
**Form or break alliances**
- **Usage:** `/alliance nation:croatia action:form`
- **Permission:** President or Minister only
- **Actions:** `form` or `break`
- **Example:** `/alliance nation:slovenia action:form`

### `/trade`
**Establish trade agreement**
- **Usage:** `/trade nation:bulgaria resource:oil amount:1000`
- **Permission:** President or Minister only
- **Resources:** oil, food, minerals, steel, coal, gold
- **Example:** `/trade nation:romania resource:food amount:5000`

### `/sanction`
**Impose or lift economic sanctions**
- **Usage:** `/sanction nation:serbia action:impose`
- **Permission:** President or Minister only
- **Actions:** `impose` or `lift`
- **Example:** `/sanction nation:albania action:impose`

### `/espionage`
**Initiate covert espionage mission**
- **Usage:** `/espionage nation:croatia`
- **Permission:** President or Minister only
- **Note:** Results are private and take time
- **Example:** `/espionage nation:greece`

### `/alliances`
**View all active alliances**
- **Usage:** `/alliances`
- **Permission:** Everyone
- **Shows:** Allied nations, who formed them, when

### `/trades`
**View all active trade agreements**
- **Usage:** `/trades`
- **Permission:** Everyone
- **Shows:** Trade partners, resources, amounts

---

## ?? Economy Commands

### `/tax`
**Set national tax rate**
- **Usage:** `/tax rate:15`
- **Permission:** President or Minister only
- **Range:** 0-50%
- **Impact:**
  - 0-15%: Economic growth, lower revenue
  - 15-30%: Balanced approach
  - 30-50%: High revenue, slower growth
- **Example:** `/tax rate:20`

### `/control`
**Control resource production/allocation**
- **Usage:** `/control resource:oil amount:5000`
- **Permission:** President or Minister only
- **Resources:** oil, food, minerals, steel, coal, gold
- **Example:** `/control resource:steel amount:3000`

### `/budget`
**View national economy status**
- **Usage:** `/budget`
- **Permission:** Everyone
- **Shows:** Tax rate, budget, resources, trades, sanctions

### `/resources`
**View detailed resource breakdown**
- **Usage:** `/resources`
- **Permission:** Everyone
- **Shows:** All resource types, amounts, last updated

### `/economyreport`
**Generate comprehensive economy report**
- **Usage:** `/economyreport`
- **Permission:** President, Minister, or Council Member
- **Shows:** Full financial status, resources, trade value, sanctions impact
- **Note:** Report is private (only you see it)

---

## ?? Quick Reference Table

| Category | Commands |
|----------|----------|
| **Government** | propose, vote, enact, laws, borders |
| **Military** | declarewar, mobilize, deploy, defense, endwar, wars |
| **Diplomacy** | alliance, trade, sanction, espionage, alliances, trades |
| **Economy** | tax, control, budget, resources, economyreport |

## ?? Permission Levels

| Role | Access |
|------|--------|
| **President** | All commands |
| **Minister** | All except endwar |
| **Council Member** | Government commands + view commands |
| **Military** | Military commands (mobilize, deploy) + view commands |
| **Everyone** | View-only commands (wars, alliances, budget, etc.) |

## ?? Usage Tips

1. **Chain Commands** for coordinated actions:
   ```
   /declarewar nation:serbia
   /mobilize unit_type:infantry amount:1000 location:border
   /defense status:high_alert
   ```

2. **Use Laws** for major decisions:
   ```
   /propose title:"War Authorization" description:"Authorize war against Serbia"
   # Wait for votes
   /enact law_id:1
   /declarewar nation:serbia
   ```

3. **Economic Strategy:**
   ```
   /tax rate:15
   /control resource:oil amount:10000
   /trade nation:romania resource:steel amount:5000
   ```

4. **Diplomatic Maneuvering:**
   ```
   /alliance nation:croatia action:form
   /trade nation:croatia resource:food amount:3000
   /sanction nation:serbia action:impose
   ```

## ?? Advanced Combos

### Full War Declaration Process
```
1. /propose title:"War Declaration" description:"Against Serbia"
2. Wait for votes
3. /enact law_id:X
4. /alliance nation:croatia action:form
5. /declarewar nation:serbia
6. /mobilize unit_type:all amount:5000 location:border
7. /defense status:defcon1
```

### Economic Overhaul
```
1. /propose title:"Economic Reform" description:"New tax structure"
2. /enact law_id:X
3. /tax rate:20
4. /control resource:gold amount:10000
5. /trade nation:romania resource:oil amount:5000
```

### Diplomatic Isolation
```
1. /alliance nation:target action:break
2. /sanction nation:target action:impose
3. /espionage nation:target
4. /propose title:"Trade Embargo" description:"Ban all trade with target"
```

## ? FAQ

**Q: Why can't I use a command?**
A: Check if you have the required role (President, Minister, etc.)

**Q: How do I see what laws are pending?**
A: Use `/laws status:pending`

**Q: Can I vote multiple times?**
A: No, each person can only vote once per law

**Q: How do I know if a command worked?**
A: You'll get a confirmation message. Check announcements channel for public actions.

**Q: What happens if Roblox is offline?**
A: Commands still work in Discord, they'll sync when Roblox is back online

---

**For detailed setup instructions, see README.md**
**For quick start, see QUICKSTART.md**
