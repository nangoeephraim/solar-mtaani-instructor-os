const EDUCATION_LEVELS = {
  Academy: [
    { id: "L3", label: "KNQF Level 3 (Artisan)", shortLabel: "L3" },
    { id: "L4", label: "KNQF Level 4 (Certificate)", shortLabel: "L4" },
    { id: "L5", label: "KNQF Level 5 (Higher Cert)", shortLabel: "L5" },
    { id: "L6", label: "KNQF Level 6 (Diploma)", shortLabel: "L6" }
  ],
  CBC: [
    { id: "PP1", label: "Pre-Primary 1", shortLabel: "PP1" },
    { id: "PP2", label: "Pre-Primary 2", shortLabel: "PP2" },
    { id: "G1", label: "Grade 1", shortLabel: "Gr 1" },
    { id: "G2", label: "Grade 2", shortLabel: "Gr 2" },
    { id: "G3", label: "Grade 3", shortLabel: "Gr 3" },
    { id: "G4", label: "Grade 4", shortLabel: "Gr 4" },
    { id: "G5", label: "Grade 5", shortLabel: "Gr 5" },
    { id: "G6", label: "Grade 6", shortLabel: "Gr 6" },
    { id: "G7", label: "Grade 7 (Junior Sec)", shortLabel: "Gr 7" },
    { id: "G8", label: "Grade 8 (Junior Sec)", shortLabel: "Gr 8" },
    { id: "G9", label: "Grade 9 (Junior Sec)", shortLabel: "Gr 9" },
    { id: "G10", label: "Grade 10 (Senior Sec)", shortLabel: "Gr 10" },
    { id: "G11", label: "Grade 11 (Senior Sec)", shortLabel: "Gr 11" },
    { id: "G12", label: "Grade 12 (Senior Sec)", shortLabel: "Gr 12" }
  ],
  "High School": [
    { id: "F1", label: "Form 1", shortLabel: "F1" },
    { id: "F2", label: "Form 2", shortLabel: "F2" },
    { id: "F3", label: "Form 3", shortLabel: "F3" },
    { id: "F4", label: "Form 4", shortLabel: "F4" }
  ],
  Campus: [
    { id: "Y1", label: "Year 1", shortLabel: "Yr 1" },
    { id: "Y2", label: "Year 2", shortLabel: "Yr 2" },
    { id: "Y3", label: "Year 3", shortLabel: "Yr 3" },
    { id: "Y4", label: "Year 4", shortLabel: "Yr 4" }
  ]
};
const getPreferences = () => {
  try {
    const stored = localStorage.getItem("prism_instructor_settings_v1");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.preferences || {};
    }
  } catch (e) {
    console.error("Failed to read preferences in educationLevels", e);
  }
  return {};
};
const getStudentGroups = (institutionType) => {
  const instType = institutionType || getPreferences().institutionType || "tvet";
  if (instType === "primary") return ["CBC"];
  if (instType === "jss") return ["CBC"];
  if (instType === "highschool") return ["High School", "CBC"];
  if (instType === "university") return ["Campus"];
  if (instType === "tvet") return ["Academy"];
  return ["Academy", "CBC", "High School", "Campus"];
};
const getLevelsForGroup = (group, institutionType) => {
  const instType = institutionType || getPreferences().institutionType || "tvet";
  const rawLevels = EDUCATION_LEVELS[group] || [];
  if (group === "CBC") {
    if (instType === "primary") {
      return rawLevels.filter((l) => ["PP1", "PP2", "G1", "G2", "G3", "G4", "G5", "G6"].includes(l.id));
    }
    if (instType === "jss") {
      return rawLevels.filter((l) => ["G7", "G8", "G9"].includes(l.id));
    }
    if (instType === "highschool") {
      return rawLevels.filter((l) => ["G10", "G11", "G12"].includes(l.id));
    }
  }
  return rawLevels;
};
const getDefaultLevel = (group, institutionType) => {
  var _a;
  const levels = getLevelsForGroup(group, institutionType);
  return ((_a = levels[0]) == null ? void 0 : _a.id) || "L3";
};
const getLevelShortLabel = (group, gradeId) => {
  const levels = getLevelsForGroup(group);
  const found = levels.find((l) => l.id === gradeId);
  if (found) return found.shortLabel;
  if (!isNaN(Number(gradeId))) return `Gr ${gradeId}`;
  return gradeId || "?";
};
export {
  getDefaultLevel as a,
  getLevelShortLabel as b,
  getLevelsForGroup as c,
  getStudentGroups as g
};
