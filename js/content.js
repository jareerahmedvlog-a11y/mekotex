// Default website content for lists rendered by script. Every text and image here is editable in the admin panel
// through its key (see site.js T() and the registry built by server/tools/build-registry.mjs).
export const CAPS = [
 {
  "id": "ginning",
  "t": "Ginning",
  "d": "Seed cotton is cleaned and the lint is separated from the seed, then pressed into bales. This is the first point of control over fibre quality.",
  "fact": "",
  "img": "FILM_ginning",
  "tex": "gin"
 },
 {
  "id": "spinning",
  "t": "Spinning",
  "d": "Opening, carding, drawing and ring spinning turn blended cotton into yarn of consistent count and strength.",
  "fact": "37,500 tons of yarn",
  "img": "FILM_spinning",
  "tex": "spin"
 },
 {
  "id": "weaving",
  "t": "Weaving",
  "d": "Warp and weft interlace on the looms to produce greige fabrics in the constructions each programme needs.",
  "fact": "17,000 tons of fabric",
  "img": "FILM_weaving",
  "tex": "weave"
 },
 {
  "id": "denim",
  "t": "Denim",
  "d": "Indigo-dyed warp is woven into twill denim fabrics.",
  "fact": "",
  "img": "FILM_denimline",
  "tex": "denim"
 },
 {
  "id": "printing",
  "t": "Digital Printing",
  "d": "Designs are printed directly onto prepared fabric. This suits short runs, sampling and many colourways without screens.",
  "fact": "11 digital printing units",
  "img": "FILM_printing",
  "tex": "print"
 },
 {
  "id": "dyeing",
  "t": "Dyeing",
  "d": "Fabric is dyed to approved shades under controlled temperature and chemistry.",
  "fact": "9,000 tons of dyed fabric",
  "img": "FILM_dyeing",
  "tex": "dye"
 },
 {
  "id": "processing",
  "t": "Processing",
  "d": "Pre-treatment by singeing, desizing, scouring and bleaching prepares greige fabric for even dyeing and printing.",
  "fact": "",
  "img": "FILM_processing",
  "tex": "proc"
 },
 {
  "id": "finishing",
  "t": "Finishing",
  "d": "Stentering and calendering set width, stability, surface and handle to the agreed specification.",
  "fact": "",
  "img": "FILM_finishing",
  "tex": "finish"
 },
 {
  "id": "cutting",
  "t": "Cutting",
  "d": "Fabric is spread on long cutting tables and cut into components, which are bundled and tracked to the stitching lines.",
  "fact": "",
  "img": "IMG_4369",
  "tex": null
 },
 {
  "id": "stitching",
  "t": "Stitching",
  "d": "Numbered stitching lines with an overhead hanger system move work between sewing stations, with live output displays on the line.",
  "fact": "1,400 tons of ready-made goods",
  "img": "IMG_4304",
  "tex": null
 },
 {
  "id": "packing",
  "t": "Packing",
  "d": "After checking, sets are folded with inserts, bagged and packed into export cartons to the buyer’s instructions.",
  "fact": "",
  "img": "IMG_4332",
  "tex": null
 },
 {
  "id": "qc",
  "t": "Quality inspection",
  "d": "Every piece is checked on dedicated inspection tables. Pieces that need correction go to ALTER bins and back to the line before approved goods move to packing.",
  "fact": "",
  "img": "IMG_4320",
  "tex": null,
  "extra": true
 },
 {
  "id": "warehouse",
  "t": "Finished-goods warehouse",
  "d": "Packed export cartons are staged on pallets by order in the finished-goods warehouse, ready for dispatch by road to Karachi's ports.",
  "fact": "",
  "img": "IMG_4408",
  "tex": null,
  "extra": true
 }
];
export const PRODUCTS = [
 {
  "id": "bedding",
  "k": "Bedding",
  "d": "Sheets, duvet covers, pillowcases and bedding sets in plain, dyed and printed qualities, made up and packed in-house.",
  "img": "FILM_bedding",
  "tex": null
 },
 {
  "id": "denim",
  "k": "Denim",
  "d": "Denim fabrics produced from indigo-dyed warp for apparel and home programmes.",
  "img": "FILM_denim",
  "tex": "denim"
 },
 {
  "id": "fabrics",
  "k": "Fabrics",
  "d": "Greige, dyed and printed woven fabrics supplied by the metre for converters and brands.",
  "img": "FILM_fabrics",
  "tex": "fabric"
 },
 {
  "id": "kitchen",
  "k": "Kitchen",
  "d": "Kitchen textiles in woven, dyed and printed qualities.",
  "img": "FILM_kitchen",
  "tex": "kitchen"
 },
 {
  "id": "window",
  "k": "Window",
  "d": "Window textiles made from in-house woven and finished fabrics.",
  "img": "FILM_window",
  "tex": "window"
 },
 {
  "id": "bath",
  "k": "Bath",
  "d": "Bath textile programmes supplied alongside bedding and home collections.",
  "img": "FILM_bath",
  "tex": "bath"
 }
];
export const SUS = [
 {
  "id": "solar",
  "t": "Solar energy",
  "d": "Rooftop photovoltaic arrays generate electricity across the site’s production roofs.",
  "i": "<path d=\"M4 18h16M6 14l2-8h8l2 8z M9 6l-1 8M15 6l1 8M5 10h14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linejoin=\"round\"/>"
 },
 {
  "id": "etp",
  "t": "Effluent Treatment Plant",
  "d": "Process water is treated before discharge to reduce its environmental impact.",
  "i": "<path d=\"M12 3c3 4 6 7 6 11a6 6 0 01-12 0c0-4 3-7 6-11z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"/><path d=\"M9 15a3 3 0 003 3\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"/>"
 },
 {
  "id": "ro",
  "t": "Reverse Osmosis plant",
  "d": "RO treatment produces high-purity process water and supports water reuse.",
  "i": "<path d=\"M4 7h16M4 12h16M4 17h16\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"8\" cy=\"7\" r=\"1.5\" fill=\"currentColor\"/><circle cx=\"15\" cy=\"12\" r=\"1.5\" fill=\"currentColor\"/><circle cx=\"10\" cy=\"17\" r=\"1.5\" fill=\"currentColor\"/>"
 },
 {
  "id": "water",
  "t": "Water conservation",
  "d": "Water use is managed and reduced across wet processing.",
  "i": "<path d=\"M3 15c3 0 3-2 6-2s3 2 6 2 3-2 6-2M3 19c3 0 3-2 6-2s3 2 6 2 3-2 6-2M12 3c2 3 3 5 3 6.5a3 3 0 01-6 0C9 8 10 6 12 3z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"/>"
 },
 {
  "id": "ozone",
  "t": "Ozone wash technology",
  "d": "Ozone-based washing can reduce water, chemical and energy use compared with conventional washes.",
  "i": "<circle cx=\"8\" cy=\"12\" r=\"3\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"15\" cy=\"8\" r=\"2.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"/><circle cx=\"16\" cy=\"16\" r=\"2.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"/>"
 },
 {
  "id": "energy",
  "t": "Energy & heat recovery",
  "d": "Heat recovery systems and energy conservation programmes cut thermal and electrical demand.",
  "i": "<path d=\"M12 3v6l4-2M12 21a7 7 0 01-7-7c0-3 2-5 4-6M12 21a7 7 0 007-7c0-2-1-4-3-5.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\"/>"
 }
];
export const CERTS = [
 {
  "id": "iso14001",
  "s": "ISO\n14001",
  "t": "ISO 14001:2015",
  "c": "Environmental management",
  "d": "An international standard for environmental management systems. It covers how an organisation identifies and controls its environmental impacts and improves performance."
 },
 {
  "id": "step",
  "s": "STeP",
  "t": "STeP by OEKO-TEX®",
  "c": "Sustainable production",
  "d": "Certification of production facilities for environmentally friendly processes, occupational health and safety, and socially responsible working conditions."
 },
 {
  "id": "gots",
  "s": "GOTS",
  "t": "Global Organic Textile Standard",
  "c": "Organic fibre processing",
  "d": "A processing standard for textiles made from organic fibres, with environmental and social criteria along the supply chain."
 },
 {
  "id": "mig",
  "s": "MiG",
  "t": "Made in Green by OEKO-TEX®",
  "c": "Traceable product label",
  "d": "A product label for textiles tested for harmful substances and made in environmentally friendly, socially responsible facilities, traceable via a product ID."
 },
 {
  "id": "bci",
  "s": "BCI",
  "t": "Better Cotton",
  "c": "Cotton sourcing",
  "d": "A programme to improve cotton farming practices. Members support more sustainable cotton production through their sourcing."
 },
 {
  "id": "te",
  "s": "OCS\nGRS\nRCS",
  "t": "Textile Exchange OCS, GRS & RCS",
  "c": "Content claim standards",
  "d": "Chain-of-custody standards that verify organic (OCS) and recycled (GRS, RCS) content claims from source to final product."
 }
];
export const GCATS = {"site":"Site & Aerial","entrance":"Entrance & Security","logistics":"Roads & Logistics","stitching":"Stitching","cutting":"Cutting","checking":"Quality Checking","packing":"Packing","warehouse":"Warehouse","solar":"Solar Energy","utilities":"Utilities","people":"Our People"};
export const STRIP = ["IMG_4247", "IMG_4229", "IMG_4375", "IMG_4302", "IMG_4317", "IMG_4403", "IMG_4290", "IMG_4224", "IMG_4347"];
export const MOSAICS = {"about": ["IMG_4226", "IMG_4231", "IMG_4299", "IMG_4394", "IMG_4350", "IMG_4255"], "sustainability": []};
// Interface text produced by script ({name}, {n}, {fact} are filled in automatically)
export const UI = {
  'chain.more': ['home', 'Manufacturing chain', 'Link to stage details', 'More on {name}'],
  'chain.output': ['home', 'Manufacturing chain', 'Output label', 'Stated output: {fact}'],
  'caps.photoLabel': ['capabilities', 'Manufacturing stages', 'Photo label', 'Mekotex facility'],
  'products.enquire': ['products', 'Product list', 'Enquiry link', 'Enquire about {name}'],
  'stat.1': ['home', 'Key figures', 'Detail for figure 1', 'Yarn is produced in the spinning department from blended cotton.'],
  'stat.2': ['home', 'Key figures', 'Detail for figure 2', 'Greige and specialist fabrics are woven in-house.'],
  'stat.3': ['home', 'Key figures', 'Detail for figure 3', 'Fabric is pre-treated and dyed to approved shades.'],
  'stat.4': ['home', 'Key figures', 'Detail for figure 4', 'Made-ups and garments are cut, stitched, checked and packed.'],
  'stat.5': ['home', 'Key figures', 'Detail for figure 5', 'Digital printing supports short runs and many colourways.'],
  'stat.note': ['home', 'Key figures', 'Note after a figure', 'Figure as stated by Mekotex.'],
  'hero.pause': ['home', 'Hero', 'Video pause button', 'Pause video'],
  'hero.play': ['home', 'Hero', 'Video play button', 'Play video'],
  'gallery.all': ['gallery', 'Gallery', 'All filter', 'All'],
  'gallery.count': ['gallery', 'Gallery', 'Photo count', '{n} photographs'],
  'videos.loading': ['videos', 'Video library', 'Loading message', 'Loading company videos…'],
  'videos.all': ['videos', 'Video library', 'All filter', 'All'],
  'videos.emptyTitle': ['videos', 'Video library', 'Empty state title', 'Company videos are coming soon'],
  'videos.emptyText': ['videos', 'Video library', 'Empty state text', 'New films from Mekotex will be published here. In the meantime, explore the facility in our photo gallery.'],
  'videos.emptyButton': ['videos', 'Video library', 'Empty state button', 'View the photo gallery'],
  'videos.noMatch': ['videos', 'Video library', 'No results message', 'No videos match your filter.'],
  'videos.showAll': ['videos', 'Video library', 'Show all button', 'Show all videos'],
  'videos.search': ['videos', 'Video library', 'Search placeholder', 'Search videos'],
  'ceo.kicker': ['ceo', 'CEO message', 'Small heading', 'Message from the CEO'],
  'ceo.emptyTitle': ['ceo', 'CEO message', 'Heading shown before the message is published', "Our Chief Executive's message will be published here."],
  'ceo.emptyText': ['ceo', 'CEO message', 'Text shown before the message is published', "Mekotex is preparing a message from its Chief Executive for international buyers, partners and visitors. In the meantime, read about the company's history and capabilities."],
  'vision.visionKicker': ['vision', 'Vision & mission statements', 'Vision small heading', 'Our vision'],
  'vision.visionTitle': ['vision', 'Vision & mission statements', 'Vision heading', 'Vision'],
  'vision.missionKicker': ['vision', 'Vision & mission statements', 'Mission small heading', 'Our mission'],
  'vision.missionTitle': ['vision', 'Vision & mission statements', 'Mission heading', 'Mission'],
  'vision.valuesKicker': ['vision', 'Vision & mission statements', 'Values small heading', 'Our values'],
  'vision.empty': ['vision', 'Vision & mission statements', 'Text shown before a statement is published', 'The statement will be published here shortly.'],
  'ceo.videoPlay': ['ceo', 'CEO message', 'Video play button label', 'Play the message from our CEO'],
  'contact.emailLabel': ['contact', 'Contact details', 'Email label', 'Email'],
};

// Simple original illustrations of what each product line is used for (shown until a real product photograph is uploaded in the admin panel).
export const PRODUCT_ART = {"denim": "<path d=\"M70 20h60l6 30-4 110h-24l-8-80-8 80H68L64 50z\" fill=\"#3b5b8c\" stroke=\"#22395e\" stroke-width=\"3\"/><path d=\"M70 34h60M100 34v30M78 22v10M122 22v10\" stroke=\"#e8b21c\" stroke-width=\"2\" stroke-dasharray=\"4 3\" fill=\"none\"/><path d=\"M72 48c8 6 16 6 20 0M108 48c4 6 12 6 20 0\" stroke=\"#e8b21c\" stroke-width=\"2\" fill=\"none\"/>", "fabric": "<g stroke=\"#10104b\" stroke-width=\"3\"><rect x=\"30\" y=\"40\" width=\"140\" height=\"26\" rx=\"13\" fill=\"#c9b79a\"/><rect x=\"30\" y=\"76\" width=\"140\" height=\"26\" rx=\"13\" fill=\"#8fa3c4\"/><rect x=\"30\" y=\"112\" width=\"140\" height=\"26\" rx=\"13\" fill=\"#d9c9b0\"/></g><g fill=\"#fff\" stroke=\"#10104b\" stroke-width=\"3\"><circle cx=\"43\" cy=\"53\" r=\"8\"/><circle cx=\"43\" cy=\"89\" r=\"8\"/><circle cx=\"43\" cy=\"125\" r=\"8\"/></g><path d=\"M170 125c14 4 18 14 10 26h-40\" fill=\"#d9c9b0\" stroke=\"#10104b\" stroke-width=\"3\"/>", "kitchen": "<path d=\"M82 22c0 12 36 12 36 0l10 6v20c0 8 10 14 18 16v92H54V64c8-2 18-8 18-16V28z\" fill=\"#f4efe6\" stroke=\"#10104b\" stroke-width=\"3\"/><path d=\"M82 22c-6-10 42-10 36 0\" fill=\"none\" stroke=\"#10104b\" stroke-width=\"3\"/><path d=\"M54 70H34M146 70h20\" stroke=\"#10104b\" stroke-width=\"3\"/><rect x=\"78\" y=\"92\" width=\"44\" height=\"30\" rx=\"4\" fill=\"#c43e34\" stroke=\"#10104b\" stroke-width=\"3\"/><path d=\"M54 140h92\" stroke=\"#c43e34\" stroke-width=\"4\"/>", "window": "<rect x=\"40\" y=\"26\" width=\"120\" height=\"124\" fill=\"#cfe3f1\" stroke=\"#10104b\" stroke-width=\"3\"/><path d=\"M100 26v124M40 88h120\" stroke=\"#10104b\" stroke-width=\"2\"/><path d=\"M30 20h140\" stroke=\"#10104b\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M36 22c4 40 22 60 10 132H34zM164 22c-4 40-22 60-10 132h12z\" fill=\"#e8b21c\" stroke=\"#10104b\" stroke-width=\"3\"/><path d=\"M40 100h14M146 100h14\" stroke=\"#10104b\" stroke-width=\"3\"/>", "bath": "<g stroke=\"#10104b\" stroke-width=\"3\"><rect x=\"46\" y=\"104\" width=\"108\" height=\"24\" rx=\"8\" fill=\"#f4efe6\"/><rect x=\"52\" y=\"80\" width=\"96\" height=\"24\" rx=\"8\" fill=\"#9fc1d6\"/><rect x=\"58\" y=\"56\" width=\"84\" height=\"24\" rx=\"8\" fill=\"#f4efe6\"/></g><path d=\"M58 66h84M52 90h96M46 114h108\" stroke=\"#10104b\" stroke-width=\"1.5\" stroke-dasharray=\"3 4\"/><path d=\"M40 134h120\" stroke=\"#10104b\" stroke-width=\"4\" stroke-linecap=\"round\"/>"};

// Default homepage hero YouTube video (can be changed in the admin panel on the hosted site).
export const HERO_YT = null;
// Bundled Mekotex corporate film: full film in the homepage hero, 0:26–1:15 on the CEO's Message page.
export const HERO_FILE = 'video/mekotex-corporate.mp4';
export const HERO_POSTER = 'video/mekotex-corporate.jpg';
export const CEO_FILE = { video: 'video/ceo-message.mp4', poster: 'video/ceo-message.jpg' };

// AI assistant (chat + voice). Switched OFF for now at the site owner's request. The full code is kept:
// change false to true here to show the chat icon again.
export const ASSISTANT_ON = false;
