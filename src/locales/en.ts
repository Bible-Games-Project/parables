export const en = {
  "app.title": "Bible Parables",

  "home.title": "Bible Parables",
  "home.play": "Play",
  "home.moreGames": "More Games",
  "home.premium": "Premium",

  "settings.title": "Settings",
  "settings.audio": "Audio",
  "settings.music": "Music",
  "settings.volume": "Volume",

  "language.title": "Language",

  "moreGames.title": "More Games",
  "moreGames.comingSoon": "Coming soon",
  "moreGames.subtitle": "More Bible Games Project titles will appear here.",

  "premium.title": "Premium",
  "premium.comingSoon": "Coming soon",
  "premium.subtitle": "Unlock exclusive parables and content soon.",

  "parablesMenu.title": "Book of Parables",
  "parablesMenu.replay": "Replay",

  "parable.lostSheep.title": "The Lost Sheep",
  "parable.goodSamaritan.title": "The Good Samaritan",
  "parable.sower.title": "The Sower",
  "parable.prodigalSon.title": "The Prodigal Son",
  "parable.lostCoin.title": "The Lost Coin",
  "parable.wiseBuilders.title": "The Wise and Foolish Builders",
  "parable.mustardSeed.title": "The Mustard Seed",
  "parable.talents.title": "The Talents",
  "parable.tenVirgins.title": "The Ten Virgins",
  "parable.hiddenTreasure.title": "The Hidden Treasure",
  "parable.pearl.title": "The Pearl of Great Price",
  "parable.wheatWeeds.title": "The Wheat and the Weeds",

  "common.locked": "Locked",
  "common.completed": "Completed",
  "common.back": "Back",
  "common.close": "Close",
  "common.continue": "Continue",
  "common.skip": "Skip",
  "common.talk": "Talk",

  "world.bookButton": "Book of Parables",
  "world.hud.stars": "Stars",
  "world.hud.parables": "Parables",
  "world.speaker.shepherd": "Shepherd",
  "world.speaker.jesus": "Jesus",
  "world.encounter.lostSheep.line1": "One of my sheep has wandered away. I have searched everywhere, but I cannot find her.",
  "world.encounter.lostSheep.line2": "If one sheep were lost, would you not leave the others and search for it?",

  "lostSheep.intro.line1": "The shepherd watches over ninety-nine sheep, safe in their fold.",
  "lostSheep.intro.line2": "But one little sheep has wandered off, alone.",
  "lostSheep.intro.line3": "As night falls, the shepherd sets out to find it.",
  "lostSheep.hud.shepherd": "Shepherd",
  "lostSheep.hud.sheep": "Lost Sheep",
  "lostSheep.objective.search": "Find the lost sheep",
  "lostSheep.objective.escort": "Bring the sheep back to the flock",
  "lostSheep.found": "You found the lost sheep!",
  "lostSheep.danger.hurry": "I must hurry... the sheep needs me!",
  "lostSheep.danger.bloodFound": "There is blood... she must be badly injured.",
  "lostSheep.gameOver.title": "The flock needed you...",
  "lostSheep.gameOver.retry": "Try Again",
  "lostSheep.victory.title": "THE LOST SHEEP",
  "lostSheep.victory.verse":
    "“There will be more joy in heaven over one sinner who repents than over ninety-nine righteous persons who do not need to repent.”",
  "lostSheep.victory.continue": "Continue",
} as const;

export type LocaleKey = keyof typeof en;
export type LocaleDictionary = Record<LocaleKey, string>;
