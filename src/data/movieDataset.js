/**
 * Curated Movie Catalog & User-Item Ratings Dataset
 *
 * Contains 44 well-known movies across diverse genres and 20 realistic
 * user profiles with historical ratings (1.0 to 5.0 scale).
 * Designed for zero-latency, deterministic Collaborative Filtering demonstrations.
 */

export const MOVIES = [
  // Sci-Fi & Mind-Benders
  { id: 'm1', title: 'Inception', year: 2010, genres: ['Sci-Fi', 'Thriller'], director: 'Christopher Nolan', summary: 'A thief enters shared dreams to plant an idea inside a target mind.' },
  { id: 'm2', title: 'Interstellar', year: 2014, genres: ['Sci-Fi', 'Drama'], director: 'Christopher Nolan', summary: 'Explorers travel through a wormhole to find a new home for humanity.' },
  { id: 'm3', title: 'The Matrix', year: 1999, genres: ['Sci-Fi', 'Action'], director: 'The Wachowskis', summary: 'A hacker discovers reality is a simulation and joins a rebellion.' },
  { id: 'm4', title: 'Arrival', year: 2016, genres: ['Sci-Fi', 'Drama'], director: 'Denis Villeneuve', summary: 'A linguist works to communicate with mysterious alien visitors.' },
  { id: 'm5', title: 'Blade Runner 2049', year: 2017, genres: ['Sci-Fi', 'Mystery'], director: 'Denis Villeneuve', summary: 'A young officer uncovers a buried secret that threatens society.' },
  { id: 'm6', title: 'Ex Machina', year: 2014, genres: ['Sci-Fi', 'Thriller'], director: 'Alex Garland', summary: 'A programmer tests the consciousness of an advanced humanoid robot.' },
  { id: 'm7', title: 'The Martian', year: 2015, genres: ['Sci-Fi', 'Adventure'], director: 'Ridley Scott', summary: 'An astronaut stranded on Mars uses science and wit to survive.' },
  { id: 'm8', title: 'Dune', year: 2021, genres: ['Sci-Fi', 'Adventure'], director: 'Denis Villeneuve', summary: 'A noble family navigates desert politics and destiny on Arrakis.' },

  // Thrillers & Mystery
  { id: 'm9', title: 'Shutter Island', year: 2010, genres: ['Thriller', 'Mystery'], director: 'Martin Scorsese', summary: 'A marshal investigates a patient disappearance at an island hospital.' },
  { id: 'm10', title: 'The Prestige', year: 2006, genres: ['Mystery', 'Drama'], director: 'Christopher Nolan', summary: 'Two rival magicians push obsession to dangerous limits in London.' },
  { id: 'm11', title: 'Gone Girl', year: 2014, genres: ['Thriller', 'Mystery'], director: 'David Fincher', summary: 'A sudden disappearance turns a quiet marriage into a media storm.' },
  { id: 'm12', title: 'Se7en', year: 1995, genres: ['Thriller', 'Crime'], director: 'David Fincher', summary: 'Two detectives track a methodical killer through a rainy city.' },
  { id: 'm13', title: 'Knives Out', year: 2019, genres: ['Mystery', 'Comedy'], director: 'Rian Johnson', summary: 'A sharp detective untangles a wealthy family web of secrets.' },
  { id: 'm14', title: 'Prisoners', year: 2013, genres: ['Thriller', 'Crime'], director: 'Denis Villeneuve', summary: 'A desperate father takes matters into his own hands during a search.' },
  { id: 'm15', title: 'Parasite', year: 2019, genres: ['Thriller', 'Drama'], director: 'Bong Joon-ho', summary: 'Two families from opposite worlds become unexpectedly entangled.' },

  // Action & Adventure
  { id: 'm16', title: 'The Dark Knight', year: 2008, genres: ['Action', 'Crime'], director: 'Christopher Nolan', summary: 'Batman faces a chaotic mastermind testing the soul of Gotham.' },
  { id: 'm17', title: 'Mad Max: Fury Road', year: 2015, genres: ['Action', 'Adventure'], director: 'George Miller', summary: 'Rebels race across a desert wasteland in a high-stakes escape.' },
  { id: 'm18', title: 'Gladiator', year: 2000, genres: ['Action', 'Drama'], director: 'Ridley Scott', summary: 'A betrayed Roman general rises through the arena seeking justice.' },
  { id: 'm19', title: 'John Wick', year: 2014, genres: ['Action', 'Thriller'], director: 'Chad Stahelski', summary: 'A retired legend returns to the underworld after a personal loss.' },
  { id: 'm20', title: 'Spider-Man: Into the Spider-Verse', year: 2018, genres: ['Animation', 'Action'], director: 'Bob Persichetti', summary: 'A teenager teams up with heroes from alternate dimensions.' },
  { id: 'm21', title: 'Top Gun: Maverick', year: 2022, genres: ['Action', 'Drama'], director: 'Joseph Kosinski', summary: 'A veteran aviator trains elite graduates for an impossible mission.' },
  { id: 'm22', title: 'Jurassic Park', year: 1993, genres: ['Adventure', 'Sci-Fi'], director: 'Steven Spielberg', summary: 'A dinosaur theme park spirals out of control during a preview tour.' },

  // Comedy & Feel-Good
  { id: 'm23', title: 'Superbad', year: 2007, genres: ['Comedy'], director: 'Greg Mottola', summary: 'Two high school best friends chase one unforgettable night before college.' },
  { id: 'm24', title: 'The Grand Budapest Hotel', year: 2014, genres: ['Comedy', 'Adventure'], director: 'Wes Anderson', summary: 'A legendary concierge and his lobby boy flee after a stolen painting.' },
  { id: 'm25', title: 'Groundhog Day', year: 1993, genres: ['Comedy', 'Romance'], director: 'Harold Ramis', summary: 'A cynical weatherman relives the same day until he changes his outlook.' },
  { id: 'm26', title: 'Paddington 2', year: 2017, genres: ['Family', 'Comedy'], director: 'Paul King', summary: 'A polite bear tries to recover a stolen pop-up book for his aunt.' },
  { id: 'm27', title: 'School of Rock', year: 2003, genres: ['Comedy', 'Family'], director: 'Richard Linklater', summary: 'A struggling guitarist turns a prep school class into a rock band.' },
  { id: 'm28', title: 'Crazy Rich Asians', year: 2018, genres: ['Comedy', 'Romance'], director: 'Jon M. Chu', summary: 'A professor travels to Singapore and meets her partner wealthy family.' },
  { id: 'm29', title: 'Home Alone', year: 1990, genres: ['Family', 'Comedy'], director: 'Chris Columbus', summary: 'An inventive kid defends his family home from two clumsy burglars.' },

  // Animation & Family
  { id: 'm30', title: 'Toy Story', year: 1995, genres: ['Animation', 'Family'], director: 'John Lasseter', summary: 'A cowboy doll learns to share the spotlight with a new space ranger.' },
  { id: 'm31', title: 'Finding Nemo', year: 2003, genres: ['Animation', 'Family'], director: 'Andrew Stanton', summary: 'A timid clownfish crosses the ocean to bring his son back home.' },
  { id: 'm32', title: 'Inside Out', year: 2015, genres: ['Animation', 'Family'], director: 'Pete Docter', summary: 'Five core emotions guide a young girl through a big move.' },
  { id: 'm33', title: 'Coco', year: 2017, genres: ['Animation', 'Family'], director: 'Lee Unkrich', summary: 'A young musician journeys through the Land of the Dead to find family truth.' },
  { id: 'm34', title: 'Spirited Away', year: 2001, genres: ['Animation', 'Adventure'], director: 'Hayao Miyazaki', summary: 'A brave girl works in a spirit bathhouse to rescue her parents.' },
  { id: 'm35', title: 'The Incredibles', year: 2004, genres: ['Animation', 'Action'], director: 'Brad Bird', summary: 'A retired superhero family reunites to stop a secret island plot.' },

  // Drama, Romance & Classics
  { id: 'm36', title: 'The Shawshank Redemption', year: 1994, genres: ['Drama', 'Classics'], director: 'Frank Darabont', summary: 'Two imprisoned men build a lasting friendship grounded in quiet hope.' },
  { id: 'm37', title: 'The Godfather', year: 1972, genres: ['Crime', 'Classics'], director: 'Francis Ford Coppola', summary: 'A reluctant son inherits control of his family empire.' },
  { id: 'm38', title: 'Forrest Gump', year: 1994, genres: ['Drama', 'Romance'], director: 'Robert Zemeckis', summary: 'A kind-hearted man witnesses decades of history while chasing love.' },
  { id: 'm39', title: 'Good Will Hunting', year: 1997, genres: ['Drama', 'Classics'], director: 'Gus Van Sant', summary: 'A gifted janitor finds direction with the help of a thoughtful therapist.' },
  { id: 'm40', title: '12 Angry Men', year: 1957, genres: ['Drama', 'Classics'], director: 'Sidney Lumet', summary: 'One juror challenges eleven others to look closer at reasonable doubt.' },
  { id: 'm41', title: 'La La Land', year: 2016, genres: ['Romance', 'Drama'], director: 'Damien Chazelle', summary: 'An aspiring actress and jazz pianist balance love with ambition.' },
  { id: 'm42', title: 'The Truman Show', year: 1998, genres: ['Drama', 'Comedy'], director: 'Peter Weir', summary: 'A cheerful insurance salesman slowly realizes his life is a TV broadcast.' },
  { id: 'm43', title: 'Whiplash', year: 2014, genres: ['Drama'], director: 'Damien Chazelle', summary: 'A driven young drummer clashes with an intense conservatory instructor.' },
  { id: 'm44', title: 'Pride & Prejudice', year: 2005, genres: ['Romance', 'Drama'], director: 'Joe Wright', summary: 'Sharp wit and stubborn pride test a slow-burning countryside romance.' },
];

export const ALL_GENRES = Array.from(
  new Set(MOVIES.flatMap((movie) => movie.genres))
).sort();

/**
 * 20 Realistic Sample User Profiles
 * Ratings are stored as { [movieId]: number } on a 1.0 - 5.0 scale.
 * Profiles form natural taste neighborhoods with realistic cross-genre overlap.
 */
export const USERS = [
  {
    id: 'u1',
    name: 'User 1: Sci-Fi & Thriller Fan',
    shortName: 'User 1',
    persona: 'Loves mind-bending sci-fi, clever twists, and suspenseful mysteries.',
    ratings: {
      m1: 5.0, m2: 5.0, m3: 4.5, m6: 4.5, m9: 5.0, m10: 4.5,
      m16: 5.0, m12: 4.0, m7: 4.5, m26: 2.0, m29: 2.5, m31: 2.5, m44: 2.0,
    },
  },
  {
    id: 'u2',
    name: 'User 2: Comedy & Family Viewer',
    shortName: 'User 2',
    persona: 'Prefers lighthearted comedies, animated adventures, and feel-good stories.',
    ratings: {
      m26: 5.0, m27: 4.5, m29: 5.0, m30: 5.0, m31: 5.0, m32: 4.5,
      m25: 4.5, m24: 4.0, m38: 4.5, m12: 1.5, m14: 2.0, m5: 2.5, m19: 2.0,
    },
  },
  {
    id: 'u3',
    name: 'User 3: Drama & Classics Enthusiast',
    shortName: 'User 3',
    persona: 'Appreciates timeless storytelling, sharp writing, and character dramas.',
    ratings: {
      m36: 5.0, m37: 5.0, m39: 5.0, m40: 5.0, m43: 4.5, m15: 4.5,
      m38: 4.5, m42: 4.5, m4: 4.0, m19: 2.0, m23: 2.0, m17: 2.5, m29: 2.5,
    },
  },
  {
    id: 'u4',
    name: 'User 4: Action & Blockbuster Seeker',
    shortName: 'User 4',
    persona: 'Enjoys fast-paced action, superhero epics, and high-energy spectacles.',
    ratings: {
      m16: 5.0, m17: 5.0, m18: 4.5, m19: 5.0, m21: 4.5, m3: 5.0,
      m22: 4.5, m1: 4.5, m35: 4.0, m44: 1.5, m41: 2.0, m26: 2.5, m40: 3.0,
    },
  },
  {
    id: 'u5',
    name: 'User 5: Mystery & Neo-Noir Buff',
    shortName: 'User 5',
    persona: 'Drawn to detective puzzles, psychological tension, and dark thrillers.',
    ratings: {
      m9: 5.0, m10: 5.0, m11: 4.5, m12: 5.0, m13: 4.5, m14: 5.0,
      m15: 5.0, m5: 4.5, m1: 4.5, m27: 2.0, m29: 2.0, m30: 2.5, m28: 2.0,
    },
  },
  {
    id: 'u6',
    name: 'User 6: Animation & Heartfelt Stories',
    shortName: 'User 6',
    persona: 'Big fan of Pixar, Studio Ghibli, and imaginative animated cinema.',
    ratings: {
      m30: 5.0, m31: 4.5, m32: 5.0, m33: 5.0, m34: 5.0, m35: 4.5,
      m20: 5.0, m26: 5.0, m24: 4.5, m11: 2.0, m12: 1.5, m19: 2.0, m14: 1.5,
    },
  },
  {
    id: 'u7',
    name: 'User 7: Deep Sci-Fi Explorer',
    shortName: 'User 7',
    persona: 'Fascinated by space travel, artificial intelligence, and speculative futures.',
    ratings: {
      m2: 5.0, m4: 5.0, m5: 5.0, m6: 5.0, m7: 4.5, m8: 5.0,
      m1: 5.0, m3: 4.5, m22: 4.0, m28: 2.0, m23: 2.0, m44: 2.0, m29: 2.0,
    },
  },
  {
    id: 'u8',
    name: 'User 8: Romance & Feel-Good Drama',
    shortName: 'User 8',
    persona: 'Enjoys emotional arcs, witty romantic comedies, and heartfelt classics.',
    ratings: {
      m41: 5.0, m44: 5.0, m28: 4.5, m25: 4.5, m38: 5.0, m39: 4.5,
      m42: 4.5, m24: 4.0, m33: 4.5, m12: 1.5, m17: 2.0, m19: 1.5, m5: 2.5,
    },
  },
  {
    id: 'u9',
    name: 'User 9: Clever Comedy & Whodunits',
    shortName: 'User 9',
    persona: 'Likes sharp humor, smart ensemble casts, and playful mysteries.',
    ratings: {
      m13: 5.0, m24: 5.0, m25: 5.0, m23: 4.5, m27: 4.5, m42: 5.0,
      m26: 4.5, m15: 4.5, m28: 4.0, m14: 2.0, m18: 2.5, m8: 2.5, m37: 3.0,
    },
  },
  {
    id: 'u10',
    name: 'User 10: Prestige Crime & Drama',
    shortName: 'User 10',
    persona: 'Follows acclaimed crime epics, intense performances, and modern masterpieces.',
    ratings: {
      m36: 5.0, m37: 5.0, m12: 4.5, m14: 4.5, m15: 5.0, m16: 5.0,
      m43: 5.0, m40: 4.5, m11: 4.5, m26: 2.0, m29: 2.0, m31: 2.5, m28: 2.0,
    },
  },
  {
    id: 'u11',
    name: 'User 11: Nolan & Villeneuve Fan',
    shortName: 'User 11',
    persona: 'Watches every major sci-fi thriller and cerebral blockbuster on opening night.',
    ratings: {
      m1: 5.0, m2: 5.0, m4: 4.5, m5: 4.5, m8: 5.0, m10: 5.0,
      m16: 5.0, m14: 4.5, m7: 4.5, m28: 2.0, m44: 2.0, m29: 2.0, m23: 2.5,
    },
  },
  {
    id: 'u12',
    name: 'User 12: Family Movie Night Host',
    shortName: 'User 12',
    persona: 'Picks crowd-pleasing hits that kids, teens, and parents all enjoy together.',
    ratings: {
      m29: 5.0, m30: 5.0, m31: 5.0, m32: 4.5, m33: 4.5, m35: 5.0,
      m22: 4.5, m27: 4.5, m20: 4.5, m12: 1.5, m11: 2.0, m14: 1.5, m6: 2.5,
    },
  },
  {
    id: 'u13',
    name: 'User 13: Indie & Auteur Cinema',
    shortName: 'User 13',
    persona: 'Drawn to stylish direction, original scripts, and festival favorites.',
    ratings: {
      m15: 5.0, m24: 5.0, m43: 5.0, m41: 4.5, m4: 4.5, m6: 4.5,
      m34: 5.0, m42: 4.5, m13: 4.5, m19: 2.0, m21: 2.5, m23: 2.5, m29: 2.0,
    },
  },
  {
    id: 'u14',
    name: 'User 14: 90s Nostalgia Viewer',
    shortName: 'User 14',
    persona: 'Loves iconic 1990s classics spanning sci-fi, comedy, and drama.',
    ratings: {
      m3: 5.0, m22: 5.0, m25: 4.5, m29: 4.5, m30: 4.5, m36: 5.0,
      m38: 5.0, m39: 4.5, m42: 4.5, m12: 4.0, m8: 3.0, m5: 3.0, m44: 2.5,
    },
  },
  {
    id: 'u15',
    name: 'User 15: High-Octane Adventure Fan',
    shortName: 'User 15',
    persona: 'Thrives on big-screen action, survival stories, and epic worlds.',
    ratings: {
      m17: 5.0, m18: 5.0, m19: 4.5, m21: 5.0, m8: 4.5, m7: 4.5,
      m22: 4.5, m16: 4.5, m35: 4.5, m44: 1.5, m41: 2.0, m28: 2.0, m40: 2.5,
    },
  },
  {
    id: 'u16',
    name: 'User 16: Psychological Suspense Fan',
    shortName: 'User 16',
    persona: 'Enjoys unreliable narrators, moral dilemmas, and tense thrillers.',
    ratings: {
      m9: 4.5, m11: 5.0, m12: 4.5, m14: 5.0, m6: 4.5, m15: 4.5,
      m10: 5.0, m43: 4.5, m40: 4.0, m26: 2.0, m27: 2.0, m31: 2.0, m29: 1.5,
    },
  },
  {
    id: 'u17',
    name: 'User 17: Animated Action & Sci-Fi',
    shortName: 'User 17',
    persona: 'Mixes vibrant animation with inventive sci-fi and superhero adventures.',
    ratings: {
      m20: 5.0, m34: 5.0, m35: 5.0, m30: 4.5, m32: 4.5, m1: 4.5,
      m3: 4.5, m7: 4.5, m16: 4.5, m44: 2.0, m37: 2.5, m11: 2.0, m14: 2.0,
    },
  },
  {
    id: 'u18',
    name: 'User 18: Classic Film Student',
    shortName: 'User 18',
    persona: 'Studies timeless cinema, screenplay structure, and dramatic tension.',
    ratings: {
      m36: 5.0, m37: 5.0, m40: 5.0, m39: 4.5, m44: 4.5, m41: 4.5,
      m38: 4.0, m42: 4.5, m10: 4.5, m23: 1.5, m19: 2.0, m29: 2.5, m17: 2.5,
    },
  },
  {
    id: 'u19',
    name: 'User 19: Weekend Crowd-Pleaser',
    shortName: 'User 19',
    persona: 'Enjoys uplifting comedies, approachable mysteries, and modern hits.',
    ratings: {
      m13: 5.0, m21: 4.5, m7: 4.5, m25: 4.5, m28: 4.5, m33: 4.5,
      m26: 4.5, m20: 4.5, m38: 4.5, m5: 2.5, m12: 2.0, m14: 2.0, m37: 2.5,
    },
  },
  {
    id: 'u20',
    name: 'User 20: Smart Thriller & Sci-Fi',
    shortName: 'User 20',
    persona: 'Gravitates toward ambitious sci-fi dramas and tightly plotted mysteries.',
    ratings: {
      m1: 5.0, m2: 4.5, m4: 5.0, m6: 4.5, m9: 4.5, m10: 4.5,
      m13: 4.5, m15: 5.0, m7: 4.5, m29: 2.0, m23: 2.0, m28: 2.5, m31: 2.5,
    },
  },
];

/**
 * Curated subset of 14 diverse, recognizable movies shown in the
 * Live Sandbox tab so new users can quickly rate movies they know.
 */
export const SANDBOX_MOVIE_IDS = [
  'm1',  // Inception (Sci-Fi / Thriller)
  'm2',  // Interstellar (Sci-Fi / Drama)
  'm16', // The Dark Knight (Action / Crime)
  'm9',  // Shutter Island (Thriller / Mystery)
  'm13', // Knives Out (Mystery / Comedy)
  'm15', // Parasite (Thriller / Drama)
  'm30', // Toy Story (Animation / Family)
  'm32', // Inside Out (Animation / Family)
  'm26', // Paddington 2 (Family / Comedy)
  'm24', // The Grand Budapest Hotel (Comedy / Adventure)
  'm36', // The Shawshank Redemption (Drama / Classics)
  'm38', // Forrest Gump (Drama / Romance)
  'm41', // La La Land (Romance / Drama)
  'm22', // Jurassic Park (Adventure / Sci-Fi)
];
