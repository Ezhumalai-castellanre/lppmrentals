// USA States and Cities Data

export interface State {
  code: string;
  name: string;
  cities: string[];
}

export const USA_STATES: State[] = [
  {
    code: "AL",
    name: "Alabama",
    cities: ["Birmingham", "Montgomery", "Huntsville", "Mobile", "Tuscaloosa", "Auburn", "Dothan", "Hoover", "Decatur", "Madison"]
  },
  {
    code: "AK",
    name: "Alaska",
    cities: ["Anchorage", "Fairbanks", "Juneau", "Sitka", "Ketchikan", "Kodiak", "Bethel", "Kotzebue", "Nome", "Palmer"]
  },
  {
    code: "AZ",
    name: "Arizona",
    cities: ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale", "Glendale", "Gilbert", "Tempe", "Peoria", "Surprise"]
  },
  {
    code: "AR",
    name: "Arkansas",
    cities: ["Little Rock", "Fort Smith", "Fayetteville", "Springdale", "Jonesboro", "North Little Rock", "Conway", "Rogers", "Pine Bluff", "Bentonville"]
  },
  {
    code: "CA",
    name: "California",
    cities: ["Los Angeles", "San Diego", "San Jose", "San Francisco", "Fresno", "Sacramento", "Long Beach", "Oakland", "Bakersfield", "Anaheim"]
  },
  {
    code: "CO",
    name: "Colorado",
    cities: ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood", "Thornton", "Arvada", "Westminster", "Pueblo", "Boulder"]
  },
  {
    code: "CT",
    name: "Connecticut",
    cities: ["Bridgeport", "New Haven", "Stamford", "Hartford", "Waterbury", "Norwalk", "Danbury", "New Britain", "Bristol", "Meriden"]
  },
  {
    code: "DE",
    name: "Delaware",
    cities: ["Wilmington", "Dover", "Newark", "Middletown", "Smyrna", "Milford", "Seaford", "Georgetown", "Elsmere", "New Castle"]
  },
  {
    code: "FL",
    name: "Florida",
    cities: ["Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg", "Hialeah", "Tallahassee", "Fort Lauderdale", "Port St. Lucie", "Cape Coral"]
  },
  {
    code: "GA",
    name: "Georgia",
    cities: ["Atlanta", "Augusta", "Columbus", "Macon", "Savannah", "Athens", "Sandy Springs", "Roswell", "Albany", "Johns Creek"]
  },
  {
    code: "HI",
    name: "Hawaii",
    cities: ["Honolulu", "Hilo", "Kailua", "Kapolei", "Kaneohe", "Mililani Town", "Ewa Gentry", "Kihei", "Makakilo", "Wahiawa"]
  },
  {
    code: "ID",
    name: "Idaho",
    cities: ["Boise", "Meridian", "Nampa", "Idaho Falls", "Pocatello", "Caldwell", "Coeur d'Alene", "Twin Falls", "Lewiston", "Post Falls"]
  },
  {
    code: "IL",
    name: "Illinois",
    cities: ["Chicago", "Aurora", "Rockford", "Joliet", "Naperville", "Springfield", "Peoria", "Elgin", "Waukegan", "Champaign"]
  },
  {
    code: "IN",
    name: "Indiana",
    cities: ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Carmel", "Bloomington", "Fishers", "Hammond", "Gary", "Lafayette"]
  },
  {
    code: "IA",
    name: "Iowa",
    cities: ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City", "Waterloo", "Ames", "West Des Moines", "Council Bluffs", "Dubuque"]
  },
  {
    code: "KS",
    name: "Kansas",
    cities: ["Wichita", "Overland Park", "Kansas City", "Olathe", "Topeka", "Lawrence", "Shawnee", "Manhattan", "Lenexa", "Salina"]
  },
  {
    code: "KY",
    name: "Kentucky",
    cities: ["Louisville", "Lexington", "Bowling Green", "Owensboro", "Covington", "Richmond", "Georgetown", "Florence", "Elizabethtown", "Nicholasville"]
  },
  {
    code: "LA",
    name: "Louisiana",
    cities: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette", "Lake Charles", "Kenner", "Bossier City", "Monroe", "Alexandria", "Houma"]
  },
  {
    code: "ME",
    name: "Maine",
    cities: ["Portland", "Lewiston", "Bangor", "South Portland", "Auburn", "Biddeford", "Sanford", "Brunswick", "Augusta", "Scarborough"]
  },
  {
    code: "MD",
    name: "Maryland",
    cities: ["Baltimore", "Frederick", "Rockville", "Gaithersburg", "Bowie", "Hagerstown", "Annapolis", "College Park", "Salisbury", "Laurel"]
  },
  {
    code: "MA",
    name: "Massachusetts",
    cities: ["Boston", "Worcester", "Springfield", "Lowell", "Cambridge", "New Bedford", "Brockton", "Quincy", "Lynn", "Fall River"]
  },
  {
    code: "MI",
    name: "Michigan",
    cities: ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Lansing", "Ann Arbor", "Flint", "Dearborn", "Livonia", "Westland"]
  },
  {
    code: "MN",
    name: "Minnesota",
    cities: ["Minneapolis", "Saint Paul", "Rochester", "Duluth", "Bloomington", "Brooklyn Park", "Plymouth", "St. Cloud", "Eagan", "Woodbury"]
  },
  {
    code: "MS",
    name: "Mississippi",
    cities: ["Jackson", "Gulfport", "Southaven", "Hattiesburg", "Biloxi", "Meridian", "Tupelo", "Greenville", "Olive Branch", "Horn Lake"]
  },
  {
    code: "MO",
    name: "Missouri",
    cities: ["Kansas City", "St. Louis", "Springfield", "Columbia", "Independence", "Lee's Summit", "O'Fallon", "St. Joseph", "St. Charles", "St. Peters"]
  },
  {
    code: "MT",
    name: "Montana",
    cities: ["Billings", "Missoula", "Great Falls", "Bozeman", "Butte", "Helena", "Kalispell", "Havre", "Anaconda", "Miles City"]
  },
  {
    code: "NE",
    name: "Nebraska",
    cities: ["Omaha", "Lincoln", "Bellevue", "Grand Island", "Kearney", "Fremont", "Hastings", "Norfolk", "Columbus", "Scottsbluff"]
  },
  {
    code: "NV",
    name: "Nevada",
    cities: ["Las Vegas", "Henderson", "Reno", "North Las Vegas", "Sparks", "Carson City", "Fernley", "Elko", "Mesquite", "Boulder City"]
  },
  {
    code: "NH",
    name: "New Hampshire",
    cities: ["Manchester", "Nashua", "Concord", "Dover", "Rochester", "Keene", "Derry", "Portsmouth", "Laconia", "Lebanon"]
  },
  {
    code: "NJ",
    name: "New Jersey",
    cities: ["Newark", "Jersey City", "Paterson", "Elizabeth", "Edison", "Woodbridge", "Lakewood", "Toms River", "Hamilton", "Trenton"]
  },
  {
    code: "NM",
    name: "New Mexico",
    cities: ["Albuquerque", "Las Cruces", "Rio Rancho", "Santa Fe", "Roswell", "Farmington", "South Valley", "Clovis", "Hobbs", "Alamogordo"]
  },
  {
    code: "NY",
    name: "New York",
    cities: ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "New Rochelle", "Mount Vernon", "Schenectady", "Utica"]
  },
  {
    code: "NC",
    name: "North Carolina",
    cities: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville", "Cary", "Wilmington", "High Point", "Greenville"]
  },
  {
    code: "ND",
    name: "North Dakota",
    cities: ["Fargo", "Bismarck", "Grand Forks", "Minot", "West Fargo", "Williston", "Dickinson", "Mandan", "Jamestown", "Wahpeton"]
  },
  {
    code: "OH",
    name: "Ohio",
    cities: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton", "Parma", "Canton", "Lorain", "Hamilton"]
  },
  {
    code: "OK",
    name: "Oklahoma",
    cities: ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow", "Lawton", "Edmond", "Moore", "Midwest City", "Enid", "Stillwater"]
  },
  {
    code: "OR",
    name: "Oregon",
    cities: ["Portland", "Salem", "Eugene", "Gresham", "Hillsboro", "Beaverton", "Bend", "Medford", "Springfield", "Corvallis"]
  },
  {
    code: "PA",
    name: "Pennsylvania",
    cities: ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton", "Bethlehem", "Lancaster", "Harrisburg", "Altoona"]
  },
  {
    code: "RI",
    name: "Rhode Island",
    cities: ["Providence", "Warwick", "Cranston", "Pawtucket", "East Providence", "Woonsocket", "Coventry", "Cumberland", "North Providence", "West Warwick"]
  },
  {
    code: "SC",
    name: "South Carolina",
    cities: ["Columbia", "Charleston", "North Charleston", "Mount Pleasant", "Rock Hill", "Greenville", "Summerville", "Sumter", "Hilton Head Island", "Florence"]
  },
  {
    code: "SD",
    name: "South Dakota",
    cities: ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings", "Watertown", "Mitchell", "Yankton", "Pierre", "Huron", "Vermillion"]
  },
  {
    code: "TN",
    name: "Tennessee",
    cities: ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville", "Murfreesboro", "Franklin", "Jackson", "Johnson City", "Hendersonville"]
  },
  {
    code: "TX",
    name: "Texas",
    cities: ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso", "Arlington", "Corpus Christi", "Plano", "Lubbock"]
  },
  {
    code: "UT",
    name: "Utah",
    cities: ["Salt Lake City", "West Valley City", "Provo", "West Jordan", "Orem", "Sandy", "Ogden", "St. George", "Layton", "South Jordan"]
  },
  {
    code: "VT",
    name: "Vermont",
    cities: ["Burlington", "South Burlington", "Rutland", "Barre", "Montpelier", "Winooski", "St. Albans", "Newport", "Vergennes", "Middlebury"]
  },
  {
    code: "VA",
    name: "Virginia",
    cities: ["Virginia Beach", "Norfolk", "Arlington", "Richmond", "Newport News", "Alexandria", "Hampton", "Roanoke", "Portsmouth", "Suffolk"]
  },
  {
    code: "WA",
    name: "Washington",
    cities: ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue", "Kent", "Everett", "Renton", "Yakima", "Federal Way"]
  },
  {
    code: "WV",
    name: "West Virginia",
    cities: ["Charleston", "Huntington", "Parkersburg", "Morgantown", "Wheeling", "Weirton", "Fairmont", "Martinsburg", "Beckley", "Clarksburg"]
  },
  {
    code: "WI",
    name: "Wisconsin",
    cities: ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine", "Appleton", "Waukesha", "Oshkosh", "Eau Claire", "Janesville"]
  },
  {
    code: "WY",
    name: "Wyoming",
    cities: ["Cheyenne", "Casper", "Laramie", "Gillette", "Rock Springs", "Sheridan", "Green River", "Evanston", "Riverton", "Cody"]
  }
];

// Helper function to get cities for a specific state
export const getCitiesForState = (stateCode: string): string[] => {
  const state = USA_STATES.find(s => s.code === stateCode);
  return state ? state.cities : [];
};

// Helper function to get state name from code
export const getStateName = (stateCode: string): string => {
  const state = USA_STATES.find(s => s.code === stateCode);
  return state ? state.name : '';
};

// Helper function to get state code from name
export const getStateCode = (stateName: string): string => {
  const state = USA_STATES.find(s => s.name === stateName);
  return state ? state.code : '';
};

// Get all state codes
export const getStateCodes = (): string[] => {
  return USA_STATES.map(state => state.code);
};

// Get all state names
export const getStateNames = (): string[] => {
  return USA_STATES.map(state => state.name);
}; 