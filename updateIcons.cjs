const fs = require("fs");

// 1. App.tsx
let appContent = fs.readFileSync("src/kinotribe/App.tsx", "utf8");

appContent = appContent.replace(/\bHome\b/g, "Film");
appContent = appContent.replace(/\bSearch\b/g, "Compass");
appContent = appContent.replace(/\bClapperboard\b/g, "MonitorPlay");
appContent = appContent.replace(/User as UserIcon/g, "CircleUser as UserIcon");

appContent = appContent.replace(
  /<Film className="w-3\.5 h-3\.5" \/>/g,
  '<Film className="w-4 h-4" strokeWidth={1.5} />',
);
appContent = appContent.replace(
  /<Compass className="w-3\.5 h-3\.5" \/>/g,
  '<Compass className="w-4 h-4" strokeWidth={1.5} />',
);
appContent = appContent.replace(
  /<MonitorPlay className="w-3\.5 h-3\.5" \/>/g,
  '<MonitorPlay className="w-4 h-4" strokeWidth={1.5} />',
);
appContent = appContent.replace(
  /<UserIcon className="w-3\.5 h-3\.5" \/>/g,
  '<UserIcon className="w-4 h-4" strokeWidth={1.5} />',
);

appContent = appContent.replace(
  /<Bell className="w-7 h-7" \/>/g,
  '<Bell className="w-6 h-6" strokeWidth={1.5} />',
);
appContent = appContent.replace(
  /<MessageSquare className="w-7 h-7" \/>/g,
  '<Send className="w-6 h-6" strokeWidth={1.5} />',
);

if (!appContent.includes("Send,")) {
  appContent = appContent.replace(
    /Bell,/g,
    "Bell,\n  Send,\n  Compass,\n  MonitorPlay,\n  CircleUser,",
  );
}

fs.writeFileSync("src/kinotribe/App.tsx", appContent);

// 2. ProfileView.tsx
let profileContent = fs.readFileSync("src/kinotribe/components/profile/ProfileView.tsx", "utf8");

if (!profileContent.includes("LayoutGrid,")) {
  profileContent = profileContent.replace(
    /Grid3X3,/g,
    "LayoutGrid,\n  MonitorPlay,\n  Contact,\n  BookOpen,",
  );
}

profileContent = profileContent.replace(
  /<Grid3X3 className="w-5 h-5 stroke-\[2\.2\]" \/>/g,
  '<LayoutGrid className="w-5 h-5 stroke-[1.5]" />',
);
profileContent = profileContent.replace(
  /<Film className="w-5 h-5 stroke-\[2\.2\]" \/>/g,
  '<MonitorPlay className="w-5 h-5 stroke-[1.5]" />',
);
profileContent = profileContent.replace(
  /<UserCheck className="w-5 h-5 stroke-\[2\.2\]" \/>/g,
  '<Contact className="w-5 h-5 stroke-[1.5]" />',
);
profileContent = profileContent.replace(
  /<Briefcase className="w-5 h-5 stroke-\[2\.2\]" \/>/g,
  '<BookOpen className="w-5 h-5 stroke-[1.5]" />',
);

fs.writeFileSync("src/kinotribe/components/profile/ProfileView.tsx", profileContent);

// 3. PostCard.tsx
let postContent = fs.readFileSync("src/kinotribe/components/feed/PostCard.tsx", "utf8");

if (!postContent.includes("MessageCircle,")) {
  postContent = postContent.replace(/MessageSquare,/g, "MessageCircle,\n  Send,");
}

postContent = postContent.replace(
  /<MessageSquare className="w-\[22px\] h-\[22px\]/g,
  '<MessageCircle className="w-[22px] h-[22px]" strokeWidth={1.5} ',
);
postContent = postContent.replace(
  /<Share2 className="w-\[22px\] h-\[22px\]/g,
  '<Send className="w-[22px] h-[22px]" strokeWidth={1.5} ',
);
postContent = postContent.replace(
  /<Bookmark className="w-\[22px\] h-\[22px\]/g,
  '<Bookmark className="w-[22px] h-[22px]" strokeWidth={1.5} ',
);
postContent = postContent.replace(
  /<Heart className="w-\[22px\] h-\[22px\]/g,
  '<Heart className="w-[22px] h-[22px]" strokeWidth={1.5} ',
);

fs.writeFileSync("src/kinotribe/components/feed/PostCard.tsx", postContent);

console.log("Icons updated.");
