const pick=(a,r)=>a[Math.floor(r()*a.length)];
function rng(seed){let h=2166136261;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const SETTINGS={
 forest:{name:'the Whispering Woods',d:['tall pine trees hummed softly in the breeze','fireflies blinked like tiny lanterns between the ferns','a silver stream giggled over smooth stones'],place:'a hollow oak tree'},
 ocean:{name:'the Moonlight Sea',d:['gentle waves rocked like a cradle','the water glowed blue where little fish swam','seashells sang when the tide rolled in'],place:'a coral cove'},
 space:{name:'the Starry Sky Kingdom',d:['planets spun slowly like sleepy tops','comets left trails of glittering dust','the Moon smiled down with a round, kind face'],place:'a cloud harbour on the Moon'},
 castle:{name:'Cloudtop Castle',d:['flags fluttered from towers made of soft pink stone','a dragon snored gently in the courtyard','the windows glowed honey-gold'],place:'the tallest tower'},
 meadow:{name:'Buttercup Meadow',d:['flowers nodded their heads in the warm wind','bees hummed a sleepy tune','the grass was soft as a blanket'],place:'the old wishing well'},
 mountains:{name:'the Misty Mountains',d:['peaks wore snowy hats','eagles drifted in slow circles','a winding path climbed up into the clouds'],place:'a cosy cave near the summit'},
 jungle:{name:'the Emerald Jungle',d:['vines swung like green ribbons','parrots chattered in rainbow colours','giant leaves made umbrellas over the path'],place:'the great banyan tree'},
 snow:{name:'Snowglobe Valley',d:['snowflakes twirled like dancers','icicles chimed like little bells','the snow sparkled under the northern lights'],place:'a little igloo with a round door'}};
const ARCS=[
 {goal:'find the lost Star Lantern that kept the night gentle',obj:'Star Lantern'},
 {goal:'deliver a special gift to the Sleepy Owl before the Moon rose high',obj:'gift'},
 {goal:'help a little lost cloud find its way home',obj:'cloud'},
 {goal:'collect three glowing dream seeds for the Night Garden',obj:'dream seeds'},
 {goal:'fix the music box that sang everyone to sleep',obj:'music box'}];
const LESSONS={
 kindness:{prob:'a small hedgehog sitting alone, too shy to ask for help',act:'knelt down, smiled, and offered to help',moral:'a little kindness can light up someone\'s whole night'},
 bravery:{prob:'a dark, rumbly tunnel that seemed very scary',act:'took a deep breath, held their friend\'s paw, and stepped forward one brave step at a time',moral:'being brave doesn\'t mean not feeling scared — it means trying anyway'},
 sharing:{prob:'a group of tiny mice who had no blanket for the cold night',act:'shared their own warm scarf and their snack, piece by piece',moral:'when we share, there is always enough happiness to go around'},
 sleep:{prob:'a yawning baby star who kept saying it wasn\'t tired',act:'showed the little star how to brush its rays, take three slow breaths, and snuggle down',moral:'a good bedtime routine helps us wake up strong and happy'},
 honesty:{prob:'a broken flower pot that nobody had seen fall',act:'told the gardener the truth, even though their tummy felt wobbly',moral:'telling the truth makes our hearts feel light'},
 patience:{prob:'a seed that would not grow, no matter how hard they wished',act:'waited, watered it each day, and sang to it softly',moral:'good things often come to those who wait'},
 friendship:{prob:'two friends who were cross with each other',act:'listened to both of them and helped them say sorry',moral:'friends who listen to each other stay friends forever'}};
const SETTING_BY_INTEREST={dinosaur:'jungle',space:'space',rocket:'space',star:'space',ocean:'ocean',fish:'ocean',mermaid:'ocean',castle:'castle',princess:'castle',knight:'castle',dragon:'castle',snow:'snow',ice:'snow',mountain:'mountains',climb:'mountains',flower:'meadow',garden:'meadow',bug:'meadow',tree:'forest',forest:'forest',jungle:'jungle',animal:'jungle'};
function generate({child,lesson,length,seed}){
 const r=rng(seed||Date.now()+child.name);
 const name=child.name, pal=child.animal||'bunny', ints=(child.interests||'').split(',').map(s=>s.trim()).filter(Boolean);
 let sk=null;for(const i of ints){for(const k in SETTING_BY_INTEREST)if(i.toLowerCase().includes(k)){sk=SETTING_BY_INTEREST[k];break}if(sk)break}
 if(!sk||r()<0.3)sk=pick(Object.keys(SETTINGS),r);
 const S=SETTINGS[sk],A=pick(ARCS,r),L=LESSONS[lesson]||LESSONS.kindness;
 const interest=ints.length?pick(ints,r):'adventures';
 const palName=pick(['Pip','Juniper','Biscuit','Moss','Coco','Pebble','Luna','Toffee','Maple'],r);
 const he=child.pronoun==='he'?'he':child.pronoun==='she'?'she':'they';
 const P=[];
 P.push(`Once upon a time, when the sky turned the colour of blueberries, ${name} lay in bed thinking about ${interest}. Suddenly, a soft tap-tap came at the window. It was ${palName} the ${pal}, wearing a tiny scarf that glowed like moonlight.`);
 P.push(`"${name}! We need your help," whispered ${palName}. "Tonight we must ${A.goal}. And everyone says you know all about ${interest}." ${name} slipped on slippers, held ${palName}'s paw, and together they floated out into ${S.name}.`);
 P.push(`In ${S.name}, ${S.d[0]}, and ${S.d[1]}. ${name} gasped with wonder. "It's even more beautiful than my dreams," ${he==='they'?name:he} said.`);
 if(length!=='short')P.push(`They followed the path deeper, past where ${S.d[2]}. ${name} used everything ${he==='they'?name:he} knew about ${interest} to spot the clues: a trail of sparkles, a hum in the air, and a map drawn in starlight.`);
 P.push(`But on the way, they found ${L.prob}. ${palName} looked at ${name}. "What should we do?"`);
 P.push(`${name} thought for a moment. Then ${he==='they'?name:he} ${L.act}. Slowly, everything began to feel warmer and brighter.`);
 if(length==='long'){P.push(`To say thank you, the new friend joined them, and the three of them sang a little travelling song as they walked: "Step by step and star by star, we are braver than we think we are."`);P.push(`At last they reached ${S.place}. There, waiting quietly, was the ${A.obj}. When ${name} touched it, a gentle glow spread across ${S.name}, and all the creatures cheered softly so as not to wake the babies.`)}
 else P.push(`Just then, they reached ${S.place}, and there was the ${A.obj}, glowing softly. All of ${S.name} sighed a happy, sleepy sigh.`);
 P.push(`${palName} gave ${name} a cuddle and carried ${he==='they'?'them':he==='he'?'him':'her'} home on a ribbon of moonlight. Tucked in bed, ${name} remembered that ${L.moral}. ${pick(['The stars twinkled goodnight.','The Moon pulled up a blanket of clouds.','Far away, a little owl hooted "sweet dreams."'],r)} Goodnight, ${name}. 🌙`);
 const title=pick([`${name} and the ${A.obj[0].toUpperCase()+A.obj.slice(1)}`,`${name}'s Night in ${S.name.replace(/^the /,'')}`,`${name}, ${palName} and the Magic of ${S.name.replace(/^the /,'')}`],r);
 const scenes=P.map((_,i)=>i===0||i===P.length-1?'bedroom':sk);
 return {title,setting:sk,lesson,pages:P.map((t,i)=>({text:t,scene:scenes[i]})),animal:pal};
}
window.Story={generate,LESSONS:Object.keys(LESSONS)};
