import { CurriculumUnit, CurriculumType } from '../types';

export const KENYAN_CURRICULA: Record<CurriculumType, Record<string, CurriculumUnit[]>> = {
  CBC: {
    'Mathematics': [
      {
        unit: 'Numbers & Fractions',
        week: 1,
        title: 'Fractions and Decimals',
        outcomes: ['Identify proper and improper fractions', 'Convert decimals to fractions and vice versa', 'Perform addition and subtraction of fractions'],
        activities: 'Visual fraction strips, division exercises, group matching games.'
      },
      {
        unit: 'Measurement',
        week: 2,
        title: 'Length, Mass and Capacity',
        outcomes: ['Estimate and measure length using standard units', 'Read weight scales accurately', 'Solve real-life problems involving volume'],
        activities: 'Practical measurement of classroom items, reading weight scales, metric conversion drills.'
      },
      {
        unit: 'Geometry',
        week: 3,
        title: 'Angles and 2D Shapes',
        outcomes: ['Identify acute, right, and obtuse angles', 'Construct regular polygons using mathematical tools', 'Classify triangles by sides and angles'],
        activities: 'Drawing shapes with protractors, classifying card cutouts.'
      }
    ],
    'Science & Tech': [
      {
        unit: 'Living Things',
        week: 1,
        title: 'Plants and Animal Classification',
        outcomes: ['Group plants into flowering and non-flowering', 'Classify animals into vertebrates and invertebrates', 'List functions of plant leaves'],
        activities: 'Exploring the school garden, drawing specimens, leaf pressing.'
      },
      {
        unit: 'Matter',
        week: 2,
        title: 'States of Matter and Heat Transfer',
        outcomes: ['Differentiate between solids, liquids, and gases', 'Demonstrate conduction, convection, and radiation', 'Explain evaporation and condensation processes'],
        activities: 'Boiling water observation, melting ice experiments, group temperature logging.'
      },
      {
        unit: 'Force & Energy',
        week: 3,
        title: 'Types of Force and Simple Machines',
        outcomes: ['Identify frictional, gravitational, and magnetic forces', 'Explain the mechanical advantage of levers and pulleys', 'Demonstrate safe handling of simple tools'],
        activities: 'Spring balance measurements, constructing a simple cardboard lever.'
      }
    ],
    'Creative Arts': [
      {
        unit: 'Visual Arts',
        week: 1,
        title: 'Drawing and Color Theory',
        outcomes: ['Draw still life arrangements with proper shading', 'Mix primary colors to produce secondary and tertiary hues', 'Apply texture using stippling techniques'],
        activities: 'Pencil shading exercises, mixing tempera paints, sketching school buildings.'
      },
      {
        unit: 'Music and Drama',
        week: 2,
        title: 'Kenyan Folk Songs & Rhythms',
        outcomes: ['Sing local patriotic and folk songs in pitch', 'Clap basic rhythmic patterns in 4/4 and 3/4 time', 'Roleplay historical Kenyan narratives'],
        activities: 'Choral singing, playing traditional percussion instruments, acting out legends.'
      }
    ],
    'Agriculture & Nutrition': [
      {
        unit: 'Soil & Crops',
        week: 1,
        title: 'Soil Types and Conservation',
        outcomes: ['Identify physical properties of sandy, clay, and loam soil', 'Demonstrate soil erosion prevention methods', 'Prepare nursery beds for vegetables'],
        activities: 'Jar sedimentation test, building small check dams on slopes, planting kale seeds.'
      },
      {
        unit: 'Healthy Eating',
        week: 2,
        title: 'Nutrients and Balanced Diets',
        outcomes: ['Identify components of a balanced meal', 'Explain the value of vitamins and mineral salts', 'Observe hygiene during food preparation'],
        activities: 'Designing a plate model with cutouts, handwashing drills, fruit salad assembly.'
      }
    ]
  },
  KNEC: {
    'Mathematics': [
      {
        unit: 'Algebra & Equations',
        week: 1,
        title: 'Quadratic Expressions and Equations',
        outcomes: ['Factorize quadratic expressions fully', 'Solve quadratic equations by completing the square', 'Apply quadratic formulas to word problems'],
        activities: 'Solving practice sheets, graphing parabolas, algebraic card matching.'
      },
      {
        unit: 'Trigonometry',
        week: 2,
        title: 'Trigonometric Ratios and Waveforms',
        outcomes: ['Define sine, cosine, and tangent ratios', 'Solve right-angled triangles using SOHCAHTOA', 'Graph trigonometric functions y = sin x and y = cos x'],
        activities: 'Clinometer height estimation outside, drawing waves on grid paper.'
      },
      {
        unit: 'Calculus',
        week: 3,
        title: 'Introduction to Differentiation',
        outcomes: ['Find the derivative of polynomial functions from first principles', 'Apply differentiation rules to find stationary points', 'Solve displacement and velocity equations'],
        activities: 'Rate of change exercises, sketching curves and inflection points.'
      }
    ],
    'Chemistry': [
      {
        unit: 'Atomic Structure',
        week: 1,
        title: 'Structure of the Atom and Periodic Table',
        outcomes: ['Describe subatomic particles (protons, neutrons, electrons)', 'Write electronic configurations for elements 1 to 20', 'Explain trends in reactivity down Group 1'],
        activities: 'Drawing Bohr models, reactivity demonstrations of sodium in water.'
      },
      {
        unit: 'Volumetric Analysis',
        week: 2,
        title: 'Titrations and Mole Calculations',
        outcomes: ['Prepare standard solutions of known concentrations', 'Conduct acid-base titrations using phenolphthalein', 'Calculate molarity, moles, and reacting masses'],
        activities: 'Hands-on titration labs, indicator color charting, numerical tutorials.'
      },
      {
        unit: 'Organic Chemistry',
        week: 3,
        title: 'Alkanes, Alkenes and Alkynes',
        outcomes: ['Draw structures of simple hydrocarbons up to butane', 'Contrast saturated and unsaturated hydrocarbons using bromine water', 'Explain fractional distillation of crude oil'],
        activities: 'Assembling ball-and-stick molecular models, oil cracking simulation.'
      }
    ],
    'Physics': [
      {
        unit: 'Mechanics',
        week: 1,
        title: 'Linear Motion and Newton\'s Laws',
        outcomes: ['Define displacement, velocity, and acceleration', 'Solve equations of motion under uniform acceleration', 'State and explain Newton\'s three laws of motion'],
        activities: 'Ticker-timer velocity tracking, toy car collision experiments.'
      },
      {
        unit: 'Electricity',
        week: 2,
        title: 'Current Electricity and Circuit Laws',
        outcomes: ['Explain the difference between series and parallel circuits', 'Apply Ohm\'s Law to calculate circuit variables', 'Define electrical resistivity and factors affecting it'],
        activities: 'Breadboard wiring of resistors, verifying values with multimeters.'
      }
    ],
    'Biology': [
      {
        unit: 'Cell Biology',
        week: 1,
        title: 'Cell Structure and Microscope Handling',
        outcomes: ['Identify parts and functions of a light microscope', 'Prepare wet mounts of onion epidermal cells', 'Compare structures of plant and animal cells'],
        activities: 'Microscope focusing drills, drawing slide specimens, staining cells with iodine.'
      },
      {
        unit: 'Genetics',
        week: 2,
        title: 'Monohybrid Inheritance and DNA',
        outcomes: ['Explain Mendel\'s laws of inheritance', 'Construct Punnett squares for genetic crosses', 'Define genotypes, phenotypes, alleles, and mutations'],
        activities: 'Coin toss genetic probability tests, drawing pedigree charts.'
      }
    ],
    'Business Studies': [
      {
        unit: 'Entrepreneurship',
        week: 1,
        title: 'Business Ideas and Opportunities',
        outcomes: ['Identify sources of business ideas', 'Evaluate potential business opportunities in the local community', 'Outline components of a basic business plan'],
        activities: 'SWOT analysis workshop, interviewing local traders, pitch presentations.'
      }
    ]
  },
  TVET_CDACC: {
    'Solar PV Installation': [
      {
        unit: 'Workplace Safety & Tools',
        session: 1,
        title: 'Workplace Safety & Protective Equipment',
        outcomes: ['Define high-voltage electrical hazards', 'Identify required PPE for solar rooftop works', 'Demonstrate emergency response to electric shock'],
        activities: 'Wearing harnesses, fire extinguisher simulator, shock response roleplay.'
      },
      {
        unit: 'Electrical Principles',
        session: 2,
        title: 'Ohm\'s Law & Multimeter Calculations',
        outcomes: ['Calculate voltage, current, and resistance variables', 'Configure multimeters to measure AC/DC voltages', 'Verify resistance values of components'],
        activities: 'Solving circuits, hands-on probe testing of battery voltages.'
      },
      {
        unit: 'Solar Panels & Battery Wiring',
        session: 3,
        title: 'Wiring Modules and Batteries in Array',
        outcomes: ['Connect PV panels in series to increase voltage', 'Wire battery banks in parallel to increase capacity', 'Measure open-circuit voltage and short-circuit current'],
        activities: 'Lab wire connections, irradiance assessment, logging battery charge curves.'
      },
      {
        unit: 'Charge Controllers & Inverters',
        session: 4,
        title: 'Installing Regulators and Power Converters',
        outcomes: ['Configure PWM and MPPT charge controller settings', 'Install DC-to-AC inverters according to load requirements', 'Verify clean sine-wave output profiles'],
        activities: 'Bench setups, oscilloscope waveforms checking, connecting loads.'
      },
      {
        unit: 'Solar System Troubleshooting',
        session: 5,
        title: 'Diagnosing Solar Array System Faults',
        outcomes: ['Diagnose bypass diode failure in shadow states', 'Inspect fuse ratings and breaker safety thresholds', 'Isolate grounding faults in battery enclosures'],
        activities: 'Troubleshooting sandbox tests, finding introduced circuit errors.'
      }
    ],
    'ICT Support Basics': [
      {
        unit: 'Hardware & OS',
        session: 1,
        title: 'Computer Hardware Components',
        outcomes: ['Identify RAM, storage, CPU, and motherboard parts', 'Install expansion cards and peripherals safely', 'Configure operating system power and user profiles'],
        activities: 'Disassembling a PC cabinet, installing device drivers.'
      },
      {
        unit: 'Office Suites',
        session: 2,
        title: 'Word Processing and Document Design',
        outcomes: ['Format formal business documents with indexes', 'Insert tables, page numbers, and custom templates', 'Save documents in PDF and archive formats'],
        activities: 'Drafting letter templates, mail merge tutorials.'
      },
      {
        unit: 'Networking & Web',
        session: 3,
        title: 'IP Addressing and Local Area Networks',
        outcomes: ['Explain IPv4 addressing and subnet masks', 'Crimp RJ-45 ethernet cables in EIA/TIA standards', 'Configure wireless routers and security protocols'],
        activities: 'Ethernet cable crimping lab, testing connection with ping command.'
      }
    ],
    'Electrical Wiring': [
      {
        unit: 'Safety & Regulations',
        session: 1,
        title: 'IEE Regulations and Statutory Safety Requirements',
        outcomes: ['Interpret basic IEE wiring code directives', 'Select correct cable ratings for specified load currents', 'Observe workplace safety rules under Energy Act rules'],
        activities: 'Reading regulation booklets, load calculations charts.'
      }
    ]
  },
  NITA: {
    'Solar PV Installer': [
      {
        unit: 'Basic Electronics',
        session: 1,
        title: 'Semiconductors and Solar Cells',
        outcomes: ['Explain P-N junction operation in silicon cells', 'Trace current flow paths in PV solar cells', 'Interpret cell performance charts'],
        activities: 'PN diode testing, graphing solar cell voltage-current relationships.'
      },
      {
        unit: 'PV Module Sizing & Mounting',
        session: 2,
        title: 'Sizing Calculations & Frame Assembly',
        outcomes: ['Size PV array structures to meet load needs', 'Assemble metal support frames at optimal tilt angles', 'Verify panel alignment is shadow-free'],
        activities: 'Load auditing exercises, roof frame assembly practicums.'
      },
      {
        unit: 'Batteries & Inverters Wiring',
        session: 3,
        title: 'Wiring Battery Enclosures and System Components',
        outcomes: ['Explain battery chemistry and state-of-charge limits', 'Wire deep-cycle batteries with correct polarity', 'Install isolation switches and line fuses'],
        activities: 'Battery bank construction, fuse assembly drills.'
      },
      {
        unit: 'Trade Test Practical',
        session: 4,
        title: 'NITA Practical Assessment Tasks',
        outcomes: ['Wire a complete off-grid solar system under exam settings', 'Conduct voltage drop calculations along cable routes', 'Diagnose system components using testing instruments'],
        activities: 'Timed complete mock trade test trials.'
      }
    ],
    'Electrical Wireman': [
      {
        unit: 'Safety & Cable Theory',
        session: 1,
        title: 'Workshop Safety & Cable Sizing',
        outcomes: ['State safety measures for domestic wire handling', 'Select cables based on current-carrying factors', 'Strip cable insulation cleanly without conductor damage'],
        activities: 'Cable stripping exercises, wire sizing calculations.'
      },
      {
        unit: 'Domestic Wiring Systems',
        session: 2,
        title: 'Switching Circuits & Conduits Wiring',
        outcomes: ['Wire one-way, two-way, and intermediate light circuits', 'Assemble radial and ring main power socket circuits', 'Run wires inside PVC conduits with clean bends'],
        activities: 'Wiring circuit boards with PVC piping, switch connection drills.'
      },
      {
        unit: 'Testing & Commissioning',
        session: 3,
        title: 'Insulation Resistance & Ground Testing',
        outcomes: ['Test loop impedance using earth tester kits', 'Measure insulation resistance values between wires', 'Conduct polarity checks at main distribution boards'],
        activities: 'Megger testing labs, filling NITA inspection checksheets.'
      }
    ]
  }
};
