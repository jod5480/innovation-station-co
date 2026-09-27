const fs = require("fs");

let content = fs.readFileSync("src/kinotribe/App.tsx", "utf8");

// The active tab texts: 'text-white font-bold'
content = content.replace(/'text-white font-bold'/g, "'text-foreground font-bold'");
content = content.replace(
  /'text-neutral-400 hover:text-white'/g,
  "'text-neutral-500 hover:text-foreground'",
);

// The header KinoTribe text
content = content.replace(
  /text-white tracking-tight flex items-center/g,
  "text-foreground tracking-tight flex items-center",
);

// Dropdown text
content = content.replace(/'rotate-180 text-white'/g, "'rotate-180 text-foreground'");
content = content.replace(/'text-white'/g, "'text-foreground'");

fs.writeFileSync("src/kinotribe/App.tsx", content);

let profileContent = fs.readFileSync("src/kinotribe/components/profile/ProfileView.tsx", "utf8");
profileContent = profileContent.replace(/text-white/g, "text-foreground");
fs.writeFileSync("src/kinotribe/components/profile/ProfileView.tsx", profileContent);
