import { CurriculumUnit, CurriculumType } from '../types';

export const KENYAN_CURRICULA: Record<CurriculumType, Record<string, CurriculumUnit[]>> = {
  CBC: {
    'Mathematics': [
      {
        unit: 'Numbers & Fractions',
        week: 1,
        title: 'Fractions, Decimals & Percentages',
        outcomes: ['Identify proper, improper and mixed fractions', 'Convert decimals to fractions and percentages', 'Perform addition and subtraction of fractions', 'Solve word problems involving simple percentages'],
        activities: 'Visual fraction strips, division exercises, fraction matching card games, shopping simulation roleplay.'
      },
      {
        unit: 'Measurement',
        week: 2,
        title: 'Length, Mass, Capacity and Time',
        outcomes: ['Estimate and measure length using standard units (metres, centimetres)', 'Read analog and digital weighing scales accurately', 'Solve real-life capacity problems in litres and millilitres', 'Convert hours to minutes and interpret timetables'],
        activities: 'Practical measurement of classroom items, reading scales, filling volume containers, drawing clock faces and reading class timetables.'
      },
      {
        unit: 'Geometry',
        week: 3,
        title: 'Angles, Lines and 2D Shapes',
        outcomes: ['Identify acute, right, obtuse, and reflex angles', 'Construct parallel and perpendicular lines using mathematical tools', 'Classify triangles and quadrilaterals by their properties'],
        activities: 'Drawing shapes with protractors, classifying shape cards, searching for shapes/angles around the school environment.'
      },
      {
        unit: 'Data Handling',
        week: 4,
        title: 'Data Collection & Representation',
        outcomes: ['Collect and record basic frequency data using tally charts', 'Represent data in simple pictographs and bar graphs', 'Interpret bar graphs to answer practical questions'],
        activities: 'Tallying classmate shoe sizes, drawing colorful bar charts, analyzing weather charts.'
      }
    ],
    'Science & Tech': [
      {
        unit: 'Living Things',
        week: 1,
        title: 'Plants and Animal Classification (CBC Standards)',
        outcomes: ['Group plants into flowering and non-flowering categories', 'Classify animals into vertebrates and invertebrates', 'Identify and list the functions of different plant parts'],
        activities: 'Exploring the school garden, specimen collection, leaf pressing, observing animals in natural habitats.'
      },
      {
        unit: 'Matter',
        week: 2,
        title: 'States of Matter and Heat Effects',
        outcomes: ['Differentiate physical states of solids, liquids, and gases', 'Demonstrate conduction, convection, and radiation experimentally', 'Explain evaporation, condensation, freezing, and sublimation'],
        activities: 'Boiling water observation, melting ice cubes, constructing a simple solar cooker, charting the water cycle.'
      },
      {
        unit: 'Force & Energy',
        week: 3,
        title: 'Forces, Simple Machines and Energy Conversion',
        outcomes: ['Identify frictional, gravitational, magnetic, and electrostatic forces', 'Explain the mechanical advantage of levers, pulleys, and inclined planes', 'Practice safe handling and maintenance of simple machines'],
        activities: 'Spring balance load measurements, constructing a simple cardboard lever, pulling loads up toy ramps.'
      },
      {
        unit: 'Digital Tools',
        week: 4,
        title: 'Introduction to Coding & Digital Devices',
        outcomes: ['Identify components of simple block programming (ScratchJr)', 'Operate a tablet or laptop to write sequential commands', 'Explain basic online safety and etiquette rules'],
        activities: 'Building a simple animated story in Scratch, identifying hardware parts, practicing strong passwords.'
      }
    ],
    'Creative Arts': [
      {
        unit: 'Visual Arts',
        week: 1,
        title: 'Drawing, Color Mixing and Shading',
        outcomes: ['Draw still life arrangements with proper scaling and perspective', 'Mix primary colors to produce vibrant secondary and tertiary colors', 'Apply unique textures using cross-hatching and stippling techniques'],
        activities: 'Pencil shading drills, mixing tempera paints, sketching landscape scenes outside the classroom.'
      },
      {
        unit: 'Music and Drama',
        week: 2,
        title: 'Kenyan Folk Songs, Rhythms & Roleplay',
        outcomes: ['Sing national patriotic and traditional folk songs in correct pitch', 'Clap and perform basic rhythmic patterns in 4/4 and 3/4 time signatures', 'Roleplay historical narratives and cultural stories of Kenya'],
        activities: 'Choral singing rehearsals, playing traditional drums and shakers, acting out local legends in groups.'
      }
    ],
    'Agriculture & Nutrition': [
      {
        unit: 'Soil & Crops',
        week: 1,
        title: 'Soil Types, Conservation and Vegetable Nurseries',
        outcomes: ['Identify sandy, clay, and loam soil by texture and sedimentation', 'Demonstrate run-off water and soil erosion prevention techniques', 'Prepare nurseries and transplant organic vegetable seeds'],
        activities: 'Jar sedimentation soil test, building small check dams on slopes, planting kale seeds in nursery boxes.'
      },
      {
        unit: 'Healthy Eating',
        week: 2,
        title: 'Nutrients, Food Groups and Meal Prep Hygiene',
        outcomes: ['Identify energy-giving, body-building, and protective foods', 'Design a balanced lunch menu using local, accessible ingredients', 'Observe strict hygiene and safety when preparing simple meals'],
        activities: 'Designing a plate model with colorful cutouts, handwashing drills, fruit salad assembly and serving.'
      }
    ]
  },
  KNEC: {
    'Mathematics': [
      {
        unit: 'Algebra & Equations',
        week: 1,
        title: 'Quadratic Expressions, Graphs and Equations',
        outcomes: ['Factorize complex quadratic expressions fully', 'Solve quadratic equations by completing the square and formula methods', 'Graph quadratic curves and determine roots and turning points'],
        activities: 'Solving practice worksheets, plotting parabolas on graph paper, quadratic cards matching games.'
      },
      {
        unit: 'Trigonometry',
        week: 2,
        title: 'Trigonometric Ratios, Circles and Waveforms',
        outcomes: ['Define sine, cosine, and tangent in right-angled triangles', 'Solve angles of elevation and depression using clinometers', 'Plot graphs of trigonometric functions y = sin x and y = cos x'],
        activities: 'Clinometer height estimation outdoors, drawing waves on grid sheets, solving trigonometric identities.'
      },
      {
        unit: 'Calculus',
        week: 3,
        title: 'Differential Calculus & Rate of Change',
        outcomes: ['Differentiate algebraic polynomial functions using standard rules', 'Find equations of tangents and normals to a curve', 'Apply differentiation to locate stationary points (maxima and minima)'],
        activities: 'Calculating rate of change, sketching curves indicating turning and inflection points, solving velocity/acceleration problems.'
      }
    ],
    'Chemistry': [
      {
        unit: 'Atomic Structure',
        week: 1,
        title: 'Structure of the Atom, Isotopes & Periodic Table',
        outcomes: ['Describe subatomic particles (protons, neutrons, electrons) and properties', 'Write electronic configurations for elements with atomic number 1 to 20', 'Explain trends in chemical reactivity down Group 1 and 7 elements'],
        activities: 'Drawing atomic models, reactivity demonstrations of alkali metals in water, periodic table trends charting.'
      },
      {
        unit: 'Volumetric Analysis',
        week: 2,
        title: 'Acid-Base Titrations, Concentration & Molarity',
        outcomes: ['Prepare standard primary solutions of known concentration', 'Perform volumetric titrations using burettes, pipettes and indicators', 'Calculate molarity, reacting moles, and mass concentrations from titration data'],
        activities: 'Hands-on titration labs, color charts matching indicators, solving chemical calculation tutorials.'
      },
      {
        unit: 'Organic Chemistry',
        week: 3,
        title: 'Alkanes, Alkenes, Alkynes & Alkanols',
        outcomes: ['Draw structures of hydrocarbons up to pentane/pentene', 'Contrast saturated and unsaturated hydrocarbons using bromine water', 'Explain fractional distillation of crude oil and industrial uses of products'],
        activities: 'Assembling ball-and-stick molecular models, oil cracking demonstration, chemical tests for double bonds.'
      }
    ],
    'Physics': [
      {
        unit: 'Mechanics',
        week: 1,
        title: 'Linear Motion, Acceleration & Newton\'s Laws',
        outcomes: ['Define displacement, velocity, acceleration, and momentum', 'Solve equations of motion under uniform linear acceleration', 'State and demonstrate Newton\'s three laws of motion'],
        activities: 'Ticker-timer velocity charting, toy car momentum collision tests, calculation drills.'
      },
      {
        unit: 'Electricity',
        week: 2,
        title: 'Current, Voltage, Resistivity & Ohm\'s Law',
        outcomes: ['Differentiate between series and parallel circuit behaviors', 'Apply Ohm\'s Law to solve simple and complex circuit loops', 'Define resistivity and explain factors affecting conductor resistance'],
        activities: 'Wiring resistors on breadboards, verifying values using multimeters, plotting voltage-current graphs.'
      }
    ],
    'Biology': [
      {
        unit: 'Cell Biology',
        week: 1,
        title: 'Cell Structure, Functions & Microscope Techniques',
        outcomes: ['Identify parts and operate a light compound microscope', 'Prepare wet mounts of onion epidermal and cheek cell specimens', 'Compare and contrast structures of plant and animal cells'],
        activities: 'Microscope focusing drills, drawing microscope specimen views, staining cells with iodine/methylene blue.'
      },
      {
        unit: 'Genetics',
        week: 2,
        title: 'Monohybrid Inheritance, DNA & Genetic Crosses',
        outcomes: ['Explain Gregor Mendel\'s laws of inheritance and probability', 'Construct Punnett squares to predict genotypes and phenotypes', 'Define mutations, alleles, and sex-linked genetic traits'],
        activities: 'Coin-toss genetic probability simulations, drafting family pedigree charts.'
      }
    ],
    'Business Studies': [
      {
        unit: 'Entrepreneurship',
        week: 1,
        title: 'Business Ideas, Opportunities & Small Enterprise Plans',
        outcomes: ['Identify viable sources of business concepts', 'Evaluate business feasibility in the local community', 'Outline components of a comprehensive business plan document'],
        activities: 'SWOT analysis workshop, local market surveys, presenting business pitch models.'
      }
    ]
  },
  TVET_CDACC: {
    'Solar PV Installation': [
      {
        unit: 'Workplace Safety & Tools',
        session: 1,
        title: 'Workplace Safety, Height Access & PPE',
        outcomes: ['Identify electrical hazards and electrical shock risks', 'Deploy correct PPE for rooftop and high-altitude solar installation', 'Perform emergency response and CPR for shock victims'],
        activities: 'Safety harness checks, fire extinguisher usage simulator, shock response drills.'
      },
      {
        unit: 'Electrical Principles',
        session: 2,
        title: 'Circuit Variables, Ohm\'s Law & Multimeters',
        outcomes: ['Apply Ohm\'s Law and Watt\'s Law to calculate solar loads', 'Measure AC/DC current, voltage, and resistance with multimeters', 'Interpret simple wiring schematics and circuit boards'],
        activities: 'Resistor sizing calculations, measuring battery bank voltages with probes.'
      },
      {
        unit: 'Solar Panels & Battery Sizing',
        session: 3,
        title: 'PV Modules, Series-Parallel Arrays & Battery Banks',
        outcomes: ['Crimp MC4 connectors and wire PV panels in series/parallel', 'Explain lead-acid and lithium battery storage principles', 'Sizing battery banks to match solar daily load calculations'],
        activities: 'MC4 crimping lab, testing array open-circuit voltages under sunlight.'
      },
      {
        unit: 'Controllers & Inverters',
        session: 4,
        title: 'PWM/MPPT Charge Controllers & DC-AC Inverters',
        outcomes: ['Install and program MPPT charge regulator parameters', 'Select and wire DC to AC sine-wave inverters safely', 'Troubleshoot voltage drop along power converter cables'],
        activities: 'Bench setups, oscilloscope check of inverter wave outputs, connecting household loads.'
      }
    ],
    'ICT Support Basics': [
      {
        unit: 'Hardware & OS',
        session: 1,
        title: 'Computer Components & Operating Systems',
        outcomes: ['Identify internal computer components (CPU, RAM, Motherboard, Disk)', 'Assemble peripherals and install expansion cards correctly', 'Configure operating system preferences, user profiles and drivers'],
        activities: 'Disassembling and cleaning a desktop unit, installing device drivers, partitioning a disk.'
      },
      {
        unit: 'Networking & Web',
        session: 2,
        title: 'IP Addressing, Crimping & LAN Setup',
        outcomes: ['Explain IPv4 classes, subnet masks, and gateways', 'Crimp RJ-45 Ethernet cables under EIA/TIA 568A/B standards', 'Configure wireless routers and security protocols (WPA2/3)'],
        activities: 'Ethernet cable assembly, testing connectivity using ping and tracert commands, router dashboard configs.'
      }
    ],
    'Electrical Wiring': [
      {
        unit: 'Safety & Regulations',
        session: 1,
        title: 'Wiring Regulations, Conduits & Main Boards',
        outcomes: ['Interpret basic regulatory requirements under the Kenya Energy Act', 'Wire one-way, two-way, and intermediate switching loops', 'Solder connections and terminate wires at a main consumer board'],
        activities: 'PVC conduit bending, running cables through channels, main board wiring board builds.'
      }
    ]
  },
  NITA: {
    'Solar PV Installer': [
      {
        unit: 'Basic Electronics',
        session: 1,
        title: 'Semiconductor Basics & Solar Cell Principles',
        outcomes: ['Explain P-N junction characteristics in monocrystalline cells', 'Graph solar cell voltage-current output curves', 'Describe solar irradiance effects on module power output'],
        activities: 'Diode testing, solar module angle irradiance testing under sun simulator.'
      },
      {
        unit: 'PV Module Sizing & Mounting',
        session: 2,
        title: 'Array Sizing, Tilt Angles & Roof Racking',
        outcomes: ['Size solar panels based on consumer energy logs', 'Assemble metallic frames with proper tilt orientation', 'Mount array securely to avoid shadow cast effects'],
        activities: 'Frame assembly drills, load analysis modeling on spreadsheets.'
      },
      {
        unit: 'Trade Test Practical',
        session: 3,
        title: 'NITA Practical Assessment Timed Task',
        outcomes: ['Wire a complete off-grid system (panel, battery, regulator, load)', 'Apply safety code directives throughout the task', 'Diagnose introduced system faults using test gear'],
        activities: 'Timed mock trade testing trials with evaluation rubrics.'
      }
    ],
    'Electrical Wireman': [
      {
        unit: 'Safety & Cable Sizing',
        session: 1,
        title: 'Workshop Safety & Conductor Sizing',
        outcomes: ['State safety rules for handling single-phase electricity', 'Determine correct wire gauge sizes for various household loads', 'Strip and splice conductors without scoring the core'],
        activities: 'Cable stripping practice, load calculation worksheets.'
      },
      {
        unit: 'Domestic Wiring',
        session: 2,
        title: 'Switching, Ring Mains & PVC Conduits',
        outcomes: ['Wire lighting loops (1-way, 2-way, intermediate)', 'Install radial and ring power socket outlets', 'Perform clean bending and mounting of PVC conduit pipes'],
        activities: 'Conduit bending, wiring lights and sockets on assessment walls.'
      },
      {
        unit: 'Testing & Commissioning',
        session: 3,
        title: 'Insulation, Polarity & Earth Loop Testing',
        outcomes: ['Measure insulation resistance using Megger instruments', 'Conduct polarity checks at the main consumer unit', 'Measure earth loop impedance and verify ground rod effectiveness'],
        activities: 'Megger testing labs, filling NITA certification checklists.'
      }
    ]
  },
  UNIVERSITY: {
    'Computer Science': [
      {
        unit: 'Intro to Programming',
        session: 1,
        title: 'Programming Logic, Control Structures & OOP',
        outcomes: ['Write clean, structured programs in Python/C++', 'Implement conditional statements and iterative loops', 'Understand Object-Oriented principles (Inheritance, Polymorphism)'],
        activities: 'Coding exercises, compiling custom scripts, modeling class relationships.'
      },
      {
        unit: 'Data Structures',
        session: 2,
        title: 'Arrays, Linked Lists, Stacks & Queues',
        outcomes: ['Implement linear data structures from scratch', 'Describe time and space complexity of sorting algorithms', 'Optimize algorithm performance using Big O notations'],
        activities: 'Algorithm implementations, complexity charts comparisons, binary tree traversals.'
      },
      {
        unit: 'Database Systems',
        session: 3,
        title: 'Relational Model, Normalization & SQL Queries',
        outcomes: ['Design entity-relationship diagrams (ERDs) for software', 'Perform database normalization to third normal form (3NF)', 'Write advanced relational algebra SQL query statements'],
        activities: 'Schema design, querying test databases with complex joins, transaction logs tracking.'
      }
    ],
    'Business Administration': [
      {
        unit: 'Management Principles',
        session: 1,
        title: 'Foundations of Modern Business & Organizational Leadership',
        outcomes: ['Explain planning, organizing, leading, and controlling structures', 'Analyze case studies of successful business adaptations', 'Understand conflict resolution and team management models'],
        activities: 'Case study reviews, group leadership roleplays, SWOT analyses.'
      },
      {
        unit: 'Microeconomics',
        session: 2,
        title: 'Supply and Demand, Elasticity & Market Systems',
        outcomes: ['Apply supply-demand models to analyze market equilibria', 'Calculate coefficient values of price elasticity', 'Evaluate firm decisions under perfect competition and monopoly'],
        activities: 'Plotting equilibrium curves, analyzing price control policies.'
      }
    ],
    'Mechanical Engineering': [
      {
        unit: 'Thermodynamics',
        session: 1,
        title: 'First and Second Laws of Thermodynamics & Heat Cycles',
        outcomes: ['Apply thermodynamic energy balance equations to systems', 'Analyze efficiency outputs of Carnot and Rankine cycles', 'Interpret temperature-entropy property charts'],
        activities: 'Cycle calculations, steam turbine simulations, heat exchanger audits.'
      },
      {
        unit: 'Fluid Mechanics',
        session: 2,
        title: 'Fluid Statics, Bernoullis Equation & Pipe Flow',
        outcomes: ['Calculate hydrostatic pressures on submerged surfaces', 'Apply Bernoullis equation to trace fluid flow routes', 'Determine friction pressure drops along pipe grids'],
        activities: 'Venturi meter labs, pipe friction experiments, pump efficiency graphs.'
      }
    ],
    'Medicine & Surgery': [
      {
        unit: 'Human Anatomy',
        session: 1,
        title: 'Gross Anatomy of Musculoskeletal and Cardiovascular Systems',
        outcomes: ['Identify major skeletal, muscular, and vascular pathways', 'Trace systemic blood circulation routes through heart structures', 'Describe nervous controls of muscular execution'],
        activities: 'Anatomy model observations, dissecting animal heart specs, drawing vascular charts.'
      },
      {
        unit: 'Pathology',
        session: 2,
        title: 'General Pathology, Cellular Adaptation & Inflammation',
        outcomes: ['Describe cellular hypertrophy, hyperplasia, and atrophy triggers', 'Differentiate acute and chronic inflammation pathways', 'Identify microscopic features of tissue cell damage'],
        activities: 'Analyzing microscopic slide specimens, histology lab journals review, case studies.'
      }
    ]
  }
};
