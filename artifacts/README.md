# Artifacts Directory - Documentation Index

This folder contains all design documentation and specifications for the Travel Companion project.

## 📄 Documents

### Core Problem & Solution
- **[problem_exploration.md](./problem_exploration.md)** - The core problem we're solving and desired outcomes

### Technical Specifications
- **[system_design_specification.md](./system_design_specification.md)** - Complete system architecture, API specs, and technical decisions

### Database Design
- **[database_schema.sql](./database_schema.sql)** - Complete PostgreSQL schema with tables, indexes, and constraints
- **[database_design_decisions.md](./database_design_decisions.md)** - Detailed rationale for all schema design decisions

### UI/UX Design
- **[UIUX/highlevel_uiux.md](./UIUX/highlevel_uiux.md)** - Complete UI wireframes, design system, and interaction patterns

### Project Status
- **[phase_0_1_complete.md](./phase_0_1_complete.md)** - Phase 0.1 completion summary and validation results

---

## 🗺️ How to Use These Documents

### For Planning
Start here when planning new features:
1. Read **problem_exploration.md** - Understand the why
2. Review **database_design_decisions.md** - Understand data model
3. Check **system_design_specification.md** - See full architecture

### For Implementation
When building:
1. Reference **database_schema.sql** - Exact SQL to run
2. Reference **system_design_specification.md** - API endpoints and logic
3. Reference **UIUX/highlevel_uiux.md** - UI components to build

### For Context Switching
If returning after time away:
1. Check **phase_0_1_complete.md** - What's done
2. Read **database_design_decisions.md** - Recent decisions
3. Review **system_design_specification.md** - Overall plan

---

## 📊 Architecture Summary

### Current State (Phase 0.1) ✅
- Chrome extension with local storage
- Right-click capture workflow
- Basic popup UI
- Toast notifications

### Database Architecture (Phase 0.2+)
```
Pool + References Model:
  users → countries → locations (the pool)
  users → trips → trip_locations → locations (references)
```

**Key Design Principles:**
1. Locations exist in country-grouped pools
2. Trips reference locations (no duplication)
3. Same location can be in multiple trips with different schedules
4. Support both single-saves and bulk imports

---

## 🎯 Next Phases

### Phase 0.2: Backend Foundation
- Build Next.js API with database schema
- Implement single-save capture endpoint
- Migration from Phase 0.1 local storage

**Reference:** database_schema.sql, system_design_specification.md

### Phase 0.3: AI Processing
- OpenAI integration for extraction
- Google Places API for verification
- Inngest job queue for async processing

**Reference:** system_design_specification.md (AI Processing Pipeline section)

### Phase 0.4: Bulk Import
- crawl4ai integration for blog parsing
- Bulk itinerary import
- Day-by-day trip organization

**Reference:** database_design_decisions.md (Import workflows)

### Phase 1.0: Map & Polish
- Google Maps visualization
- Route optimization
- Sharing and collaboration

**Reference:** UIUX/highlevel_uiux.md

---

## 🔑 Key Decisions Documented

### Database Design
- **Pool vs. Ownership:** Chose pool + references (many-to-many)
- **Grouping:** Locations grouped by country
- **Scheduling:** Trip-specific via trip_locations table
- **Editing:** Shared locations update everywhere
- **Deletion:** Two-level delete (from trip vs. from pool)

See: **database_design_decisions.md** for full rationale

### API Architecture
- RESTful endpoints
- Async job processing via Inngest
- No authentication for Phase 0.2 (trust userId)
- Google Places + OpenAI for enrichment

See: **system_design_specification.md** for API specs

### UI/UX Principles
- Zero cognitive load
- Instant feedback
- Content-first design
- Speed matters (< 2s interactions)

See: **UIUX/highlevel_uiux.md** for design system

---

## 📝 Document Versions

| Document | Version | Last Updated | Status |
|----------|---------|--------------|--------|
| problem_exploration.md | 1.0 | Oct 11, 2025 | Approved |
| system_design_specification.md | 1.0 | Oct 11, 2025 | Approved |
| database_schema.sql | 1.0 | Oct 11, 2025 | Approved |
| database_design_decisions.md | 1.0 | Oct 11, 2025 | Approved |
| UIUX/highlevel_uiux.md | 1.0 | Oct 11, 2025 | Approved |
| phase_0_1_complete.md | 1.0 | Oct 11, 2025 | Complete |

---

## 🚀 Quick Links

**Implementation Guides:**
- [Main README](../README.md) - Project overview
- [Quick Start](../QUICK_START.md) - Get running in 5 minutes
- [Extension README](../extension/README.md) - Extension docs
- [Development Guide](../extension/DEVELOPMENT.md) - Developer setup

**For AI/LLMs Reading This:**
When planning or implementing features, always:
1. Check this artifacts folder first
2. Reference the relevant specification
3. Follow the established patterns
4. Update documents when designs change

---

**Last Updated:** October 11, 2025  
**Project Status:** Phase 0.1 Complete, Phase 0.2 Ready to Build

