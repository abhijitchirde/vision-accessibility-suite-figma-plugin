# Accessibility Genie - Documentation Index

**Plugin Name**: Accessibility Genie
**Version**: 1.0
**Last Updated**: 2025-11-21

---

## 📚 Documentation Overview

This folder contains comprehensive technical documentation for the Accessibility Genie Figma plugin. Read the documents in numerical order for the best understanding.

---

## 📖 Documents

### [01-plugin-architecture.md](./01-plugin-architecture.md)
**Plugin Architecture & System Design**

Complete architectural overview of the plugin including:
- High-level architecture diagram
- System components (UI Layer, Plugin Code Layer, Services)
- Technology stack and dependencies
- Data flow and communication patterns
- Module structure and file organization
- Performance considerations
- Scalability and extensibility

**Read this first** to understand the overall system design.

---

### [02-implementation-plan.md](./02-implementation-plan.md)
**Phase-Wise Implementation Plan**

Detailed development roadmap with **tool-based modular phases** (one tool per phase):

**Development Approach**: Pragmatic, incremental development where each tool is implemented as a self-contained phase. Infrastructure (components, services, utilities) is built only when first needed, but always as proper reusable modules.

**Implementation Protocols**: Includes strict guidelines for:
- Phase start confirmation workflow
- Git commit recommendations (format and requirements)
- Tool-specific documentation requirements (data flows, references, testing)

**Phase Structure** (13 phases):
- **Phase 0**: Project Setup & Verification
- **Phase 1**: Contrast Checker (+ initial infrastructure)
- **Phase 2**: Touch Targets Checker
- **Phase 3**: Typography Checker
- **Phase 4**: Vision Simulator
- **Phase 5**: Automatic Monitoring
- **Phase 6**: Alt-Text Manager (first annotation tool)
- **Phase 7**: Focus Order Manager
- **Phase 8**: Headings Manager
- **Phase 9**: Landmarks Manager
- **Phase 10**: Accessibility Notes
- **Phase 11**: Integration & Polish
- **Phase 12**: Auto Scan & Fix (deferred)

Each phase includes:
- Detailed implementation tasks
- Infrastructure to be built (when first needed)
- Tool-specific module structure
- Comprehensive README template
- Git commit recommendations
- Testing approach

**Read this** to understand the modular development strategy and phase details.

---

### [03-component-structure.md](./03-component-structure.md)
**Component Structure & UI Specifications**

Complete UI component library and design system:
- Design system (colors, typography, spacing, shadows)
- Base UI components (Button, Card, Badge, Modal, etc.)
- View components (MainView)
- Panel components (ContrastPanel, HeadingsPanel, etc.)
- Component props and APIs
- CSS styling patterns

**Read this** when implementing the UI layer.

---

### [04-data-models-storage.md](./04-data-models-storage.md)
**Data Models & Storage Strategy**

Complete data architecture and storage patterns:
- Storage architecture using Figma Plugin Data API
- TypeScript data models for all features:
  - Alt-Text Data
  - Heading Data
  - Landmark Data
  - Focus Order Data
  - Accessibility Notes Data
  - Plugin Settings
  - Monitoring Results
- Storage keys and naming conventions
- Data versioning and migration strategies
- Export formats (JSON, CSV, Markdown)
- Best practices and performance optimization

**Read this** when implementing data persistence.

---

## 🎯 Quick Start Guide

### For First-Time Readers

1. **Start here**: Read [01-plugin-architecture.md](./01-plugin-architecture.md) for system overview
2. **Planning**: Read [02-implementation-plan.md](./02-implementation-plan.md) to understand the phased roadmap
3. **Development**: Use [03-component-structure.md](./03-component-structure.md) and [04-data-models-storage.md](./04-data-models-storage.md) as reference during implementation

### For Developers Joining the Project

1. Read all documents in order (01 → 04)
2. Review Implementation Protocols in [02-implementation-plan.md](./02-implementation-plan.md)
3. Verify Phase 0 setup (useFigmaMessage and useFigmaTheme hooks already exist)
4. Request confirmation before starting Phase 1 (Contrast Checker)

---

## 🔑 Key Concepts

### Architecture Highlights

- **Offline-first**: All features work without internet
- **Privacy-friendly**: Data stored locally in Figma files
- **Standards-based**: WCAG 2.1, ARIA, platform guidelines
- **Modular**: Each feature is independent and extensible
- **React-based**: Modern component architecture
- **Pragmatic**: Infrastructure built when needed, not speculatively
- **Tool-based phases**: One tool per phase for focused development

### Technology Stack

- **UI**: React 18.3+ with TypeScript
- **Build**: Webpack 5
- **Styling**: CSS Modules
- **State**: React Context + Hooks
- **API**: Figma Plugin API

### Feature Categories

**Testing Tools** (5 features):
1. Contrast Checker
2. Typography Checker
3. Touch Targets Checker
4. Vision Simulator
5. Automatic Monitoring

**Annotation Tools** (5 features):
1. Alt-Text Manager
2. Focus Order Manager
3. Headings Manager
4. Landmarks Manager
5. Accessibility Notes

---

## 📊 Development Timeline

**Tool-Based Modular Development**: Each accessibility tool is implemented as a separate phase, allowing for independent development and Git commits.

| Phase | Tool/Deliverable | Duration | Category |
|-------|------------------|----------|----------|
| Phase 0 | Project Setup & Verification | Quick | Foundation |
| Phase 1 | Contrast Checker (+ initial infrastructure) | 1-2 weeks | Testing Tool |
| Phase 2 | Touch Targets Checker | 1 week | Testing Tool |
| Phase 3 | Typography Checker | 1 week | Testing Tool |
| Phase 4 | Vision Simulator | 1 week | Testing Tool |
| Phase 5 | Automatic Monitoring | 1 week | Testing Tool |
| Phase 6 | Alt-Text Manager | 1 week | Annotation Tool |
| Phase 7 | Focus Order Manager | 1 week | Annotation Tool |
| Phase 8 | Headings Manager | 1 week | Annotation Tool |
| Phase 9 | Landmarks Manager | 1 week | Annotation Tool |
| Phase 10 | Accessibility Notes | 1 week | Annotation Tool |
| Phase 11 | Integration & Polish | 1-2 weeks | Polish |
| Phase 12 | Auto Scan & Fix | Deferred | Advanced |
| **Total** | **Full v1.0 (Phases 0-11)** | **13-15 weeks** | **Complete Plugin** |

**Development Philosophy**:
- Build infrastructure when first needed (not speculatively)
- Each phase is self-contained and committable
- Proper reusable modules from the start (no inline code)
- Comprehensive tool documentation with each phase

---

## 🎨 UI Design Reference

The initial UI is based on the provided screenshot showing:
- Header with "Auto Scan & Fix" button
- Two main sections: "Testing tools" and "Annotation tools"
- Card-based navigation for each tool
- Clean, minimal design with icons
- Bottom section with credits and settings

The UI design will be refined in later phases based on user feedback.

---

## 🗂️ File Structure

```
accessibility-genie/
├── documentation/           # ← You are here
│   ├── 00-README.md        # This file
│   ├── 01-plugin-architecture.md
│   ├── 02-implementation-plan.md
│   ├── 03-component-structure.md
│   └── 04-data-models-storage.md
│
├── src/
│   ├── code.ts             # Plugin code entry
│   ├── ui.tsx              # UI entry
│   ├── types/              # TypeScript types
│   ├── constants/          # Constants
│   ├── utils/              # Utility functions
│   ├── services/           # Core services
│   ├── features/           # Feature modules
│   ├── components/         # React components
│   ├── hooks/              # React hooks
│   └── contexts/           # React contexts
│
├── dist/                   # Build output
├── manifest.json           # Plugin manifest
├── package.json
├── tsconfig.json
└── webpack.config.js
```

---

## 🚀 Next Steps

1. **Review** all documentation documents (01 → 04)
2. **Verify** Phase 0 setup (hooks already exist)
3. **Request confirmation** before starting Phase 1
4. **Implement** one tool per phase following Implementation Protocols
5. **Document** each tool with comprehensive README
6. **Commit** after each phase completion (see Git commit guidelines)
7. **Test continuously** throughout development

---

## 📝 Notes

- This is an **original plugin** called "Accessibility Genie"
- The analysis was based on studying competitor features, but this is entirely new implementation
- All code and documentation are created from scratch
- Focus on standards-based, offline-first architecture
- Extensible design for future enhancements

---

## 🤝 Contributing

When adding new features:
1. Follow the established architecture patterns
2. Add feature to both testing or annotation category
3. Create feature module in `src/features/`
4. Add UI panel in `src/components/panels/`
5. Update documentation
6. Write tests

---

## 📞 Support

For questions or issues:
- Review relevant documentation section
- Check implementation plan for detailed tasks
- Refer to architecture for system design decisions

---

**Document Status**: ✅ Complete
**Documentation Version**: 2.0
**Last Updated**: 2025-11-21
