// Initialize local cross-window channel
const displayChannel = new BroadcastChannel('zisus_bible_channel');

// Feature 4: Multi-translation schema (Expand this array with your complete GitHub Bible dataset)
const BIBLE_DATABASE = [
  {
    book: "John",
    chapter: 3,
    verse: 16,
    keywords: ["love", "world", "son", "eternal life", "perish", "god's love", "salvation", "believe", "everlasting"],
    translations: {
      kjv: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
      niv: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
      nlt: "For this is how God loved the world: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life.",
      esv: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.",
      nasb: "For God so loved the world, that He gave His only Son, so that everyone who believes in Him will not perish, but have eternal life.",
      nkjv: "For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.",
      amp: "For God so greatly loved and dearly prized the world, that He even gave His only begotten Son...",
      msg: "This is how much God loved the world: He gave his Son, his one and only Son...",
      csb: "For God loved the world in this way: He gave his one and only Son...",
      nrsv: "For God so loved the world that he gave his only Son...",
      cev: "God loved the people of this world so much that he gave his only Son...",
      gnt: "For God loved the world so much that he gave his only Son...",
      tpt: "For this is how much God loved the world—he gave his one and only, unique Son...",
      bsb: "For God so loved the world that He gave His one and only Son...",
      asv: "For God so loved the world, that he gave his only begotten Son..."
    }
  },
  {
    book: "Psalms",
    chapter: 23,
    verse: 1,
    keywords: ["shepherd", "want", "lack", "provision", "lord is my shepherd", "care", "guide", "green pastures"],
    translations: {
      kjv: "The LORD is my shepherd; I shall not want.",
      niv: "The LORD is my shepherd, I lack nothing.",
      nlt: "The LORD is my shepherd; I have all that I need.",
      esv: "The LORD is my shepherd; I shall not want.",
      nasb: "The LORD is my shepherd, I will not be in need.",
      nkjv: "The LORD is my shepherd; I shall not want.",
      amp: "The LORD is my Shepherd [to feed, to guide and to shield me], I shall not want.",
      msg: "GOD my shepherd! I don't need a thing.",
      csb: "The LORD is my shepherd; I have what I need.",
      nrsv: "The LORD is my shepherd, I shall not want.",
      cev: "You, LORD, are my shepherd, and I have all I need.",
      gnt: "The LORD is my shepherd; I have everything I need.",
      tpt: "The Lord is my best friend and my shepherd. I always have more than enough.",
      bsb: "The LORD is my shepherd; I shall not want.",
      asv: "Jehovah is my shepherd; I shall not want."
    }
  }
];

let activeTranslation = 'kjv'; // KJV as default
let displayWindowRef = null;
let currentActiveVerse = null;

// Feature 4: Switch translation on the fly
document.getElementById('translation-select').addEventListener('change', (e) => {
  activeTranslation = e.target.value;
  if (currentActiveVerse) {
    projectVerse(currentActiveVerse);
  }
});

// Feature 1: Background Image Upload via local browser memory
document.getElementById('bg-uploader').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const imageDataUrl = event.target.result;
      displayChannel.postMessage({ type: 'UPDATE_BACKGROUND', image: imageDataUrl });
    };
    reader.readAsDataURL(file);
  }
});

// Feature 2: Open and Close Display screen window
document.getElementById('open-display-btn').addEventListener('click', () => {
  displayWindowRef = window.open('display.html', 'ZisusDisplay', 'width=1024,height=768');
});

document.getElementById('close-display-btn').addEventListener('click', () => {
  displayChannel.postMessage({ type: 'CLOSE_WINDOW' });
  if (displayWindowRef && !displayWindowRef.closed) {
    displayWindowRef.close();
  }
});

// Feature 3: Voice recognition to search topics without chapter/verse names
const voiceBtn = document.getElementById('voice-btn');
const voiceStatus = document.getElementById('voice-status');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';

  voiceBtn.addEventListener('click', () => {
    recognition.start();
    voiceStatus.textContent = "Listening... Speak topics like 'God's love' or 'The Lord is my shepherd'.";
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase();
    voiceStatus.textContent = `Recognized: "${transcript}"`;
    searchTopicAndProject(transcript);
  };

  recognition.onerror = (event) => {
    voiceStatus.textContent = `Voice error: ${event.error}`;
  };
} else {
  voiceStatus.textContent = "Web Speech API is not supported in this browser.";
}

function searchTopicAndProject(spokenText) {
  let bestMatch = null;
  let highestScore = 0;

  BIBLE_DATABASE.forEach(entry => {
    let score = 0;

    // Keyword relevance score
    entry.keywords.forEach(keyword => {
      if (spokenText.includes(keyword.toLowerCase())) {
        score += 3;
      }
    });

    // Substring match score against verse text
    const textSample = (entry.translations[activeTranslation] || entry.translations['kjv']).toLowerCase();
    const words = spokenText.split(' ');
    words.forEach(word => {
      if (word.length > 3 && textSample.includes(word)) {
        score += 1;
      }
    });

    if (score > highestScore) {
      highestScore = score;
      bestMatch = entry;
    }
  });

  if (bestMatch && highestScore > 0) {
    currentActiveVerse = bestMatch;
    projectVerse(bestMatch);
    voiceStatus.textContent += ` -> Found: ${bestMatch.book} ${bestMatch.chapter}:${bestMatch.verse}`;
  } else {
    voiceStatus.textContent += " -> No matching scripture topic found.";
  }
}

function projectVerse(verseObj) {
  const verseText = verseObj.translations[activeTranslation] || verseObj.translations['kjv'];
  const reference = `${verseObj.book} ${verseObj.chapter}:${verseObj.verse} (${activeTranslation.toUpperCase()})`;

  displayChannel.postMessage({
    type: 'SHOW_VERSE',
    reference: reference,
    text: verseText
  });
}
