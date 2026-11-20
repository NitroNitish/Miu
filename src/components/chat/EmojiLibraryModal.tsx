import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Sparkles, Heart, Smile, ThumbsUp, PartyPopper, Coffee, Flame } from 'lucide-react';

export interface EmojiData {
  emoji: string;
  name: string;
  keywords: string[];
}

export interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  emojis: EmojiData[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'smileys',
    name: 'Smileys & Emotion',
    icon: Smile,
    emojis: [
      { emoji: '😀', name: 'Grinning Face', keywords: ['smile', 'happy', 'grin'] },
      { emoji: '😃', name: 'Smiling Face with Big Eyes', keywords: ['smile', 'happy', 'joy'] },
      { emoji: '😄', name: 'Grinning Face with Smiling Eyes', keywords: ['laugh', 'happy', 'smile'] },
      { emoji: '😁', name: 'Beaming Face', keywords: ['grin', 'teeth', 'smile'] },
      { emoji: '😆', name: 'Grinning Squinting Face', keywords: ['laugh', 'lol', 'haha'] },
      { emoji: '😅', name: 'Grinning Face with Sweat', keywords: ['sweat', 'relief', 'nervous'] },
      { emoji: '😂', name: 'Face with Tears of Joy', keywords: ['laugh', 'crying', 'lol', 'funny'] },
      { emoji: '🤣', name: 'Rolling on the Floor Laughing', keywords: ['rofl', 'laugh', 'lol'] },
      { emoji: '🥲', name: 'Smiling Face with Tear', keywords: ['tear', 'emotional', 'grateful'] },
      { emoji: '🥹', name: 'Face Holding Back Tears', keywords: ['pleading', 'proud', 'tear'] },
      { emoji: '☺️', name: 'Smiling Face', keywords: ['blush', 'warm', 'happy'] },
      { emoji: '😊', name: 'Smiling Face with Smiling Eyes', keywords: ['blush', 'proud', 'sweet'] },
      { emoji: '😇', name: 'Smiling Face with Halo', keywords: ['angel', 'innocent', 'good'] },
      { emoji: '🙂', name: 'Slightly Smiling Face', keywords: ['smile', 'calm', 'fine'] },
      { emoji: '🙃', name: 'Upside-Down Face', keywords: ['silly', 'sarcasm', 'irony'] },
      { emoji: '😉', name: 'Winking Face', keywords: ['wink', 'flirt', 'joke'] },
      { emoji: '😌', name: 'Relieved Face', keywords: ['peace', 'relaxed', 'calm'] },
      { emoji: '😍', name: 'Heart Eyes', keywords: ['love', 'crush', 'heart', 'adore'] },
      { emoji: '🥰', name: 'Smiling Face with Hearts', keywords: ['love', 'warmth', 'adore', 'fond'] },
      { emoji: '😘', name: 'Face Blowing a Kiss', keywords: ['kiss', 'love', 'flirt'] },
      { emoji: '😗', name: 'Kissing Face', keywords: ['kiss', 'whistle'] },
      { emoji: '😙', name: 'Kissing Face with Smiling Eyes', keywords: ['kiss', 'smile'] },
      { emoji: '😚', name: 'Kissing Face with Closed Eyes', keywords: ['kiss', 'blush'] },
      { emoji: '😋', name: 'Face Savoring Food', keywords: ['yummy', 'delicious', 'tasty'] },
      { emoji: '😛', name: 'Face with Tongue', keywords: ['tongue', 'silly', 'playful'] },
      { emoji: '😜', name: 'Winking Face with Tongue', keywords: ['winky', 'tongue', 'crazy'] },
      { emoji: '🤪', name: 'Zany Face', keywords: ['goofy', 'crazy', 'wild'] },
      { emoji: '😝', name: 'Squinting Face with Tongue', keywords: ['tongue', 'prank', 'silly'] },
      { emoji: '🤑', name: 'Money-Mouth Face', keywords: ['money', 'rich', 'dollar'] },
      { emoji: '🤗', name: 'Hugging Face', keywords: ['hug', 'open', 'embrace'] },
      { emoji: '🫣', name: 'Face with Peeking Eye', keywords: ['peek', 'shy', 'scared', 'hidden'] },
      { emoji: '🤫', name: 'Shushing Face', keywords: ['quiet', 'secret', 'shh'] },
      { emoji: '🤔', name: 'Thinking Face', keywords: ['think', 'wonder', 'hmm', 'curious'] },
      { emoji: '🫡', name: 'Saluting Face', keywords: ['salute', 'respect', 'yes sir'] },
      { emoji: '🤐', name: 'Zipper-Mouth Face', keywords: ['silent', 'mute', 'secret'] },
      { emoji: '🤨', name: 'Face with Raised Eyebrow', keywords: ['doubt', 'suspicious', 'skeptical'] },
      { emoji: '😐', name: 'Neutral Face', keywords: ['meh', 'blank', 'okay'] },
      { emoji: '😑', name: 'Expressionless Face', keywords: ['flat', 'unimpressed', 'tired'] },
      { emoji: '😶', name: 'Face Without Mouth', keywords: ['speechless', 'silent'] },
      { emoji: '😏', name: 'Smirking Face', keywords: ['smirk', 'flirt', 'sly'] },
      { emoji: '😒', name: 'Unamused Face', keywords: ['bored', 'annoyed', 'grumpy'] },
      { emoji: '🙄', name: 'Face with Rolling Eyes', keywords: ['eyeroll', 'annoyed', 'whatever'] },
      { emoji: '😬', name: 'Grimacing Face', keywords: ['awkward', 'cringe', 'eek'] },
      { emoji: '😮‍💨', name: 'Face Exhaling', keywords: ['sigh', 'relief', 'gasp'] },
      { emoji: '🤥', name: 'Lying Face', keywords: ['pinocchio', 'lie', 'fake'] },
      { emoji: '😌', name: 'Peaceful Face', keywords: ['serene', 'calm', 'zen'] },
      { emoji: '😴', name: 'Sleeping Face', keywords: ['sleep', 'tired', 'zzz'] },
      { emoji: '🤤', name: 'Drooling Face', keywords: ['drool', 'craving', 'sleep'] },
      { emoji: '😷', name: 'Face with Medical Mask', keywords: ['sick', 'mask', 'covid'] },
      { emoji: '🤒', name: 'Face with Thermometer', keywords: ['sick', 'fever', 'ill'] },
      { emoji: '🤕', name: 'Face with Head-Bandage', keywords: ['hurt', 'injured', 'pain'] },
      { emoji: '🤢', name: 'Nauseated Face', keywords: ['gross', 'sick', 'vomit'] },
      { emoji: '🤮', name: 'Face Vomiting', keywords: ['puke', 'gross', 'sick'] },
      { emoji: '🤧', name: 'Sneezing Face', keywords: ['sneeze', 'cold', 'tissue'] },
      { emoji: '🥵', name: 'Hot Face', keywords: ['hot', 'sweat', 'summer', 'spicy'] },
      { emoji: '🥶', name: 'Cold Face', keywords: ['freezing', 'ice', 'winter'] },
      { emoji: '🥴', name: 'Woozy Face', keywords: ['dizzy', 'drunk', 'tired'] },
      { emoji: '😵', name: 'Face with Crossed-Out Eyes', keywords: ['knocked out', 'dizzy'] },
      { emoji: '😵‍💫', name: 'Face with Spiral Eyes', keywords: ['hypnotized', 'dazed'] },
      { emoji: '🤯', name: 'Exploding Head', keywords: ['mind blown', 'shocked', 'crazy'] },
      { emoji: '🤠', name: 'Cowboy Hat Face', keywords: ['cowboy', 'country', 'howdy'] },
      { emoji: '🥳', name: 'Partying Face', keywords: ['party', 'celebrate', 'horn'] },
      { emoji: '🥸', name: 'Disguised Face', keywords: ['disguise', 'mustache', 'glasses'] },
      { emoji: '😎', name: 'Smiling Face with Sunglasses', keywords: ['cool', 'sun', 'chill'] },
      { emoji: '🤓', name: 'Nerd Face', keywords: ['nerd', 'geek', 'glasses'] },
      { emoji: '🧐', name: 'Face with Monocle', keywords: ['curious', 'inspect', 'fancy'] },
      { emoji: '😕', name: 'Confused Face', keywords: ['confused', 'lost', 'hmm'] },
      { emoji: '😟', name: 'Worried Face', keywords: ['worry', 'concerned', 'nervous'] },
      { emoji: '🙁', name: 'Slightly Frowning Face', keywords: ['frown', 'sad'] },
      { emoji: '😮', name: 'Face with Open Mouth', keywords: ['wow', 'surprised', 'omg'] },
      { emoji: '😯', name: 'Hushed Face', keywords: ['speechless', 'stunned'] },
      { emoji: '😲', name: 'Astonished Face', keywords: ['shocked', 'gasp', 'wow'] },
      { emoji: '😳', name: 'Flushed Face', keywords: ['blush', 'shy', 'stunned', 'embarrassed'] },
      { emoji: '🥺', name: 'Pleading Face', keywords: ['puppy eyes', 'begging', 'cute', 'please'] },
      { emoji: '😦', name: 'Frowning Face with Open Mouth', keywords: ['sad', 'aww', 'scared'] },
      { emoji: '😨', name: 'Fearful Face', keywords: ['scared', 'afraid', 'shock'] },
      { emoji: '😰', name: 'Anxious Face with Sweat', keywords: ['nervous', 'anxiety', 'sweat'] },
      { emoji: '😥', name: 'Sad but Relieved Face', keywords: ['phew', 'relieved', 'close'] },
      { emoji: '😢', name: 'Crying Face', keywords: ['tear', 'sad', 'cry'] },
      { emoji: '😭', name: 'Loudly Crying Face', keywords: ['sob', 'cry', 'weep', 'sad'] },
      { emoji: '😱', name: 'Face Screaming in Fear', keywords: ['munch', 'scary', 'scream', 'omg'] },
      { emoji: '😖', name: 'Confounded Face', keywords: ['frustrated', 'quiver'] },
      { emoji: '😣', name: 'Persevering Face', keywords: ['struggling', 'ouch'] },
      { emoji: '😞', name: 'Disappointed Face', keywords: ['sad', 'regret', 'down'] },
      { emoji: '😓', name: 'Downcast Face with Sweat', keywords: ['exhausted', 'tired'] },
      { emoji: '😩', name: 'Weary Face', keywords: ['tired', 'fed up', 'groan'] },
      { emoji: '😫', name: 'Tired Face', keywords: ['whine', 'exhausted', 'ugh'] },
      { emoji: '🥱', name: 'Yawning Face', keywords: ['yawn', 'sleepy', 'bored'] },
      { emoji: '😤', name: 'Face with Steam From Nose', keywords: ['huff', 'angry', 'determined'] },
      { emoji: '😡', name: 'Enraged Face', keywords: ['angry', 'mad', 'furious'] },
      { emoji: '😠', name: 'Angry Face', keywords: ['mad', 'grr', 'annoyed'] },
      { emoji: '🤬', name: 'Face with Symbols on Mouth', keywords: ['curse', 'swear', 'swearing'] },
      { emoji: '😈', name: 'Smiling Face with Horns', keywords: ['devil', 'evil', 'naughty'] },
      { emoji: '👿', name: 'Angry Face with Horns', keywords: ['demon', 'devil', 'angry'] },
      { emoji: '💀', name: 'Skull', keywords: ['dead', 'death', 'skeleton', 'i am dead'] },
      { emoji: '☠️', name: 'Skull and Crossbones', keywords: ['danger', 'pirate', 'poison'] },
      { emoji: '💩', name: 'Pile of Poo', keywords: ['poop', 'crap', 'funny'] },
      { emoji: '🤡', name: 'Clown Face', keywords: ['circus', 'fool', 'joke'] },
      { emoji: '👻', name: 'Ghost', keywords: ['spooky', 'boo', 'halloween'] },
      { emoji: '👽', name: 'Alien', keywords: ['ufo', 'space', 'extraterrestrial'] },
      { emoji: '👾', name: 'Alien Monster', keywords: ['game', 'pixel', 'retro'] },
      { emoji: '🤖', name: 'Robot', keywords: ['bot', 'droid', 'machine'] },
    ],
  },
  {
    id: 'love',
    name: 'Love & Hearts',
    icon: Heart,
    emojis: [
      { emoji: '❤️', name: 'Red Heart', keywords: ['love', 'heart', 'romance'] },
      { emoji: '🩷', name: 'Pink Heart', keywords: ['love', 'cute', 'pink'] },
      { emoji: '🧡', name: 'Orange Heart', keywords: ['orange', 'love', 'warmth'] },
      { emoji: '💛', name: 'Yellow Heart', keywords: ['yellow', 'friendship', 'sun'] },
      { emoji: '💚', name: 'Green Heart', keywords: ['green', 'nature', 'life'] },
      { emoji: '💙', name: 'Blue Heart', keywords: ['blue', 'peace', 'loyalty'] },
      { emoji: '🩵', name: 'Light Blue Heart', keywords: ['calm', 'sky', 'cyan'] },
      { emoji: '💜', name: 'Purple Heart', keywords: ['purple', 'lavender', 'miu'] },
      { emoji: '🖤', name: 'Black Heart', keywords: ['dark', 'goth', 'black'] },
      { emoji: '🩶', name: 'Grey Heart', keywords: ['silver', 'neutral', 'grey'] },
      { emoji: '🤍', name: 'White Heart', keywords: ['pure', 'white', 'peace'] },
      { emoji: '🤎', name: 'Brown Heart', keywords: ['brown', 'earth', 'warm'] },
      { emoji: '💔', name: 'Broken Heart', keywords: ['breakup', 'sad', 'heartbreak'] },
      { emoji: '❤️‍🔥', name: 'Heart on Fire', keywords: ['passion', 'lust', 'fire'] },
      { emoji: '❤️‍🩹', name: 'Mending Heart', keywords: ['healing', 'recovering', 'bandage'] },
      { emoji: '❣️', name: 'Heart Exclamation', keywords: ['heart', 'punctuation', 'love'] },
      { emoji: '💕', name: 'Two Hearts', keywords: ['love', 'affection', 'together'] },
      { emoji: '💞', name: 'Revolving Hearts', keywords: ['revolving', 'love', 'hearts'] },
      { emoji: '💓', name: 'Beating Heart', keywords: ['pulse', 'thump', 'flutter'] },
      { emoji: '💗', name: 'Growing Heart', keywords: ['growing', 'expand', 'spark'] },
      { emoji: '💖', name: 'Sparkling Heart', keywords: ['sparkle', 'magic', 'glitter'] },
      { emoji: '💘', name: 'Heart with Arrow', keywords: ['cupid', 'crush', 'struck'] },
      { emoji: '💝', name: 'Heart with Ribbon', keywords: ['gift', 'present', 'box'] },
      { emoji: '💟', name: 'Heart Decoration', keywords: ['purple', 'badge', 'cute'] },
      { emoji: '💌', name: 'Love Letter', keywords: ['envelope', 'mail', 'note'] },
      { emoji: '💋', name: 'Kiss Mark', keywords: ['lips', 'kiss', 'lipstick'] },
      { emoji: '🫶', name: 'Heart Hands', keywords: ['hands', 'love', 'support', 'appreciate'] },
      { emoji: '🫂', name: 'People Hugging', keywords: ['hug', 'embrace', 'comfort', 'friends'] },
      { emoji: '💐', name: 'Bouquet', keywords: ['flowers', 'roses', 'love'] },
      { emoji: '🌹', name: 'Rose', keywords: ['flower', 'red', 'romance'] },
      { emoji: '🥀', name: 'Wilted Flower', keywords: ['sad', 'fading', 'rose'] },
    ],
  },
  {
    id: 'gestures',
    name: 'Hands & Gestures',
    icon: ThumbsUp,
    emojis: [
      { emoji: '👍', name: 'Thumbs Up', keywords: ['yes', 'agree', 'like', 'good', 'ok'] },
      { emoji: '👎', name: 'Thumbs Down', keywords: ['no', 'dislike', 'bad'] },
      { emoji: '👏', name: 'Clapping Hands', keywords: ['applause', 'praise', 'bravo'] },
      { emoji: '🙌', name: 'Raising Hands', keywords: ['celebrate', 'hooray', 'yay'] },
      { emoji: '👐', name: 'Open Hands', keywords: ['open', 'hug', 'welcome'] },
      { emoji: '🤲', name: 'Palms Up Together', keywords: ['prayer', 'cupped', 'hope'] },
      { emoji: '🤝', name: 'Handshake', keywords: ['deal', 'agree', 'meeting', 'partnership'] },
      { emoji: '🙏', name: 'Folded Hands', keywords: ['please', 'thank you', 'namaste', 'pray'] },
      { emoji: '✌️', name: 'Victory Hand', keywords: ['peace', 'v', 'two'] },
      { emoji: '🤞', name: 'Crossed Fingers', keywords: ['luck', 'hope', 'promise'] },
      { emoji: '🫰', name: 'Hand with Index Finger and Thumb Crossed', keywords: ['korean heart', 'snap', 'love'] },
      { emoji: '🤟', name: 'Love-You Gesture', keywords: ['ily', 'rock on', 'love'] },
      { emoji: '🤘', name: 'Sign of the Horns', keywords: ['rock', 'metal', 'party'] },
      { emoji: '🤙', name: 'Call Me Hand', keywords: ['shaka', 'phone', 'hang loose'] },
      { emoji: '👈', name: 'Backhand Index Pointing Left', keywords: ['point', 'left', 'this'] },
      { emoji: '👉', name: 'Backhand Index Pointing Right', keywords: ['point', 'right', 'there'] },
      { emoji: '👆', name: 'Backhand Index Pointing Up', keywords: ['point', 'up', 'above'] },
      { emoji: '👇', name: 'Backhand Index Pointing Down', keywords: ['point', 'down', 'below'] },
      { emoji: '☝️', name: 'Index Pointing Up', keywords: ['listen', 'one', 'point'] },
      { emoji: '🫵', name: 'Index Pointing at the Viewer', keywords: ['you', 'point', 'chosen'] },
      { emoji: '✋', name: 'Raised Hand', keywords: ['high five', 'stop', 'hand'] },
      { emoji: '🤚', name: 'Raised Back of Hand', keywords: ['backhand', 'stop'] },
      { emoji: '🖐️', name: 'Hand with Fingers Splayed', keywords: ['five', 'spread', 'wave'] },
      { emoji: '🖖', name: 'Vulcan Salute', keywords: ['spock', 'star trek', 'prosper'] },
      { emoji: '👋', name: 'Waving Hand', keywords: ['hello', 'bye', 'wave', 'hi'] },
      { emoji: '👊', name: 'Oncoming Fist', keywords: ['punch', 'fist bump', 'bro'] },
      { emoji: '✊', name: 'Raised Fist', keywords: ['power', 'solidarity', 'strength'] },
      { emoji: '🤛', name: 'Left-Facing Fist', keywords: ['fist bump', 'hit'] },
      { emoji: '🤜', name: 'Right-Facing Fist', keywords: ['fist bump', 'hit'] },
      { emoji: '💪', name: 'Flexed Biceps', keywords: ['strong', 'gym', 'workout', 'muscle'] },
      { emoji: '💅', name: 'Nail Polish', keywords: ['slay', 'glamour', 'care'] },
      { emoji: '🤳', name: 'Selfie', keywords: ['camera', 'photo', 'phone'] },
    ],
  },
  {
    id: 'vibes',
    name: 'Spark & Celebration',
    icon: Flame,
    emojis: [
      { emoji: '🔥', name: 'Fire', keywords: ['lit', 'hot', 'flame', 'hype'] },
      { emoji: '✨', name: 'Sparkles', keywords: ['stars', 'magic', 'shine', 'clean', 'glow'] },
      { emoji: '⭐', name: 'Star', keywords: ['favorite', 'night', 'rate'] },
      { emoji: '🌟', name: 'Glowing Star', keywords: ['glow', 'shining', 'special'] },
      { emoji: '💫', name: 'Dizzy Star', keywords: ['sparkle', 'magic', 'spin'] },
      { emoji: '💥', name: 'Collision', keywords: ['boom', 'blast', 'crash'] },
      { emoji: '💯', name: 'Hundred Points', keywords: ['perfect', 'score', 'keep it 100'] },
      { emoji: '🎉', name: 'Party Popper', keywords: ['tada', 'celebrate', 'congrats'] },
      { emoji: '🎊', name: 'Confetti Ball', keywords: ['celebrate', 'party', 'festival'] },
      { emoji: '🎈', name: 'Balloon', keywords: ['birthday', 'party', 'celebration'] },
      { emoji: '🎂', name: 'Birthday Cake', keywords: ['bday', 'candles', 'dessert'] },
      { emoji: '🎁', name: 'Wrapped Gift', keywords: ['present', 'birthday', 'surprise'] },
      { emoji: '🏆', name: 'Trophy', keywords: ['winner', 'first', 'champion'] },
      { emoji: '🥇', name: '1st Place Medal', keywords: ['gold', 'winner', 'number one'] },
      { emoji: '👑', name: 'Crown', keywords: ['queen', 'king', 'royal', 'slay'] },
      { emoji: '💎', name: 'Gem Stone', keywords: ['diamond', 'precious', 'jewel'] },
      { emoji: '🎮', name: 'Video Game', keywords: ['gaming', 'controller', 'play', 'game'] },
      { emoji: '🎲', name: 'Game Die', keywords: ['dice', 'luck', 'chance'] },
      { emoji: '🎯', name: 'Direct Hit', keywords: ['bullseye', 'target', 'goal'] },
      { emoji: '🚀', name: 'Rocket', keywords: ['launch', 'blast off', 'moon', 'fast'] },
      { emoji: '🌙', name: 'Crescent Moon', keywords: ['night', 'sleep', 'dream'] },
      { emoji: '☀️', name: 'Sun', keywords: ['sunny', 'morning', 'bright'] },
      { emoji: '🌈', name: 'Rainbow', keywords: ['pride', 'colors', 'sky'] },
    ],
  },
  {
    id: 'cozy',
    name: 'Cozy & Treats',
    icon: Coffee,
    emojis: [
      { emoji: '☕', name: 'Hot Beverage', keywords: ['coffee', 'tea', 'cafe', 'morning'] },
      { emoji: '🍵', name: 'Teacup Without Handle', keywords: ['matcha', 'green tea', 'zen'] },
      { emoji: '🧋', name: 'Bubble Tea', keywords: ['boba', 'milktea', 'sweet'] },
      { emoji: '🥂', name: 'Clinking Glasses', keywords: ['cheers', 'toast', 'celebrate'] },
      { emoji: '🍷', name: 'Wine Glass', keywords: ['wine', 'drink', 'dinner'] },
      { emoji: '🍸', name: 'Cocktail Glass', keywords: ['martini', 'drink', 'party'] },
      { emoji: '🍻', name: 'Clinking Beer Mugs', keywords: ['beer', 'pub', 'cheers'] },
      { emoji: '🥐', name: 'Croissant', keywords: ['bakery', 'french', 'breakfast'] },
      { emoji: '🥞', name: 'Pancakes', keywords: ['breakfast', 'syrup', 'sweet'] },
      { emoji: '🍕', name: 'Pizza', keywords: ['cheese', 'slice', 'dinner'] },
      { emoji: '🍔', name: 'Hamburger', keywords: ['burger', 'fast food'] },
      { emoji: '🍟', name: 'French Fries', keywords: ['chips', 'snack'] },
      { emoji: '🌮', name: 'Taco', keywords: ['mexican', 'food'] },
      { emoji: '🍣', name: 'Sushi', keywords: ['japanese', 'fish', 'rice'] },
      { emoji: '🍦', name: 'Soft Ice Cream', keywords: ['vanilla', 'sweet', 'summer'] },
      { emoji: '🍩', name: 'Doughnut', keywords: ['donut', 'glaze', 'sweet'] },
      { emoji: '🍪', name: 'Cookie', keywords: ['chocolate chip', 'snack'] },
      { emoji: '🍫', name: 'Chocolate Bar', keywords: ['sweet', 'candy'] },
      { emoji: '🍿', name: 'Popcorn', keywords: ['movie', 'cinema', 'snack'] },
      { emoji: '🍓', name: 'Strawberry', keywords: ['fruit', 'sweet', 'berry'] },
      { emoji: '🥑', name: 'Avocado', keywords: ['toast', 'healthy'] },
      { emoji: '🐱', name: 'Cat Face', keywords: ['kitty', 'kitten', 'meow', 'cute'] },
      { emoji: '🐶', name: 'Dog Face', keywords: ['puppy', 'bark', 'woof'] },
      { emoji: '🐰', name: 'Rabbit Face', keywords: ['bunny', 'cute', 'hop'] },
      { emoji: '🐼', name: 'Panda', keywords: ['cute', 'bear', 'bamboo'] },
      { emoji: '🦊', name: 'Fox', keywords: ['clever', 'wild'] },
      { emoji: '🐻', name: 'Bear', keywords: ['teddy', 'cute', 'hug'] },
      { emoji: '🦋', name: 'Butterfly', keywords: ['beauty', 'wings', 'nature'] },
      { emoji: '🌸', name: 'Cherry Blossom', keywords: ['sakura', 'flower', 'spring'] },
    ],
  },
];

interface EmojiLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  messagePreview?: string;
}

export const EmojiLibraryModal: React.FC<EmojiLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
  messagePreview,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(EMOJI_CATEGORIES[0].id);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Local storage for user's recently picked emojis
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('miu_recent_emojis');
      return saved ? JSON.parse(saved) : ['❤️', '🔥', '😂', '🥺', '✨', '🥰', '👍', '👏'];
    } catch {
      return ['❤️', '🔥', '😂', '🥺', '✨', '🥰', '👍', '👏'];
    }
  });

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter emojis based on search query
  const filteredEmojis = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const matches: EmojiData[] = [];
    const seen = new Set<string>();

    for (const cat of EMOJI_CATEGORIES) {
      for (const item of cat.emojis) {
        if (seen.has(item.emoji)) continue;
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesKeywords = item.keywords.some((k) => k.toLowerCase().includes(q));
        const matchesEmoji = item.emoji === q;

        if (matchesName || matchesKeywords || matchesEmoji) {
          matches.push(item);
          seen.add(item.emoji);
        }
      }
    }
    return matches;
  }, [searchQuery]);

  if (!isOpen) return null;

  const handlePickEmoji = (emoji: string) => {
    // Save to recents
    setRecentEmojis((prev) => {
      const updated = [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 16);
      try {
        localStorage.setItem('miu_recent_emojis', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    onSelectEmoji(emoji);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal / Bottom Sheet Card */}
      <div className="relative z-10 w-full max-w-[440px] max-h-[82vh] h-[520px] bg-[#191A1D] border border-[#303136] rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Top Header */}
        <div className="px-4 pt-3.5 pb-2 border-b border-[#28292E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B6A4DC] shadow-[0_0_8px_rgba(182,164,220,0.8)]" />
            <h3 className="text-sm font-bold text-[#F5F5F5] tracking-tight">
              React to Message
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message preview snippet if available */}
        {messagePreview && (
          <div className="px-4 py-1.5 bg-[#141517] border-b border-[#24252A] text-[11px] text-[#8C867E] truncate italic">
            "{messagePreview}"
          </div>
        )}

        {/* Search Bar */}
        <div className="p-3 border-b border-[#28292E]">
          <div className="relative flex items-center bg-[#232428] rounded-xl px-3 py-2 border border-transparent focus-within:border-[#B6A4DC]/60 transition-colors">
            <Search className="w-4 h-4 text-neutral-400 shrink-0 mr-2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all emojis..."
              className="flex-1 bg-transparent text-xs text-[#F5F5F5] placeholder-neutral-500 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-0.5 rounded-full text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Navigation Pills (when not searching) */}
        {!searchQuery && (
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#24252A] overflow-x-auto no-scrollbar">
            {recentEmojis.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('recent');
                  document.getElementById('cat-recent')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === 'recent'
                    ? 'bg-[#B6A4DC]/20 text-[#B6A4DC]'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recent</span>
              </button>
            )}

            {EMOJI_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-[#B6A4DC]/20 text-[#B6A4DC]'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Main Emojis Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {filteredEmojis ? (
            /* Search Results */
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Search Results ({filteredEmojis.length})
              </p>
              {filteredEmojis.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500">
                  No emojis found matching "{searchQuery}"
                </div>
              ) : (
                <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5 sm:gap-2">
                  {filteredEmojis.map((item, idx) => (
                    <button
                      key={`${item.emoji}-${idx}`}
                      type="button"
                      onClick={() => handlePickEmoji(item.emoji)}
                      className="aspect-square flex items-center justify-center text-2xl hover:scale-125 active:scale-95 transition-transform duration-100 rounded-xl hover:bg-white/10 cursor-pointer"
                      title={item.name}
                    >
                      {item.emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Categorized Sections */
            <>
              {/* Recently Used */}
              {recentEmojis.length > 0 && (
                <div id="cat-recent">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3 h-3 text-[#B6A4DC]" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Frequently Used
                    </span>
                  </div>
                  <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5 sm:gap-2">
                    {recentEmojis.map((emoji, idx) => (
                      <button
                        key={`${emoji}-${idx}`}
                        type="button"
                        onClick={() => handlePickEmoji(emoji)}
                        className="aspect-square flex items-center justify-center text-2xl hover:scale-125 active:scale-95 transition-transform duration-100 rounded-xl hover:bg-white/10 cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* All Categories */}
              {EMOJI_CATEGORIES.map((cat) => (
                <div key={cat.id} id={`cat-${cat.id}`} className="pt-1">
                  <div className="flex items-center gap-1.5 mb-2">
                    <cat.icon className="w-3 h-3 text-[#B6A4DC]" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      {cat.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5 sm:gap-2">
                    {cat.emojis.map((item, idx) => (
                      <button
                        key={`${item.emoji}-${idx}`}
                        type="button"
                        onClick={() => handlePickEmoji(item.emoji)}
                        className="aspect-square flex items-center justify-center text-2xl hover:scale-125 active:scale-95 transition-transform duration-100 rounded-xl hover:bg-white/10 cursor-pointer"
                        title={item.name}
                      >
                        {item.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmojiLibraryModal;
