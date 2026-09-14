

const DAY=86400000, $=id=>document.getElementById(id);
function safeStoredJSON(primary,fallback,defaultValue){
  for(const key of [primary,fallback].filter(Boolean)){
    try{const raw=localStorage.getItem(key);if(raw!=null)return JSON.parse(raw)}catch(e){console.warn('Ignoring invalid saved data for',key,e)}
  }
  return defaultValue;
}
const D=window.NIHONGO_DATA||{buildCards:()=>[]};
const settings=Object.assign({goal:20,newLimit:8,showRomaji:true},safeStoredJSON('rn_final_settings','rn22_settings',{}));
let progress=safeStoredJSON('rn_final_progress','rn22_progress',{});
let stats=Object.assign({reviews:0,streak:0,lastDay:'',days:{}},safeStoredJSON('rn_final_stats','rn22_stats',{}));
let personal=safeStoredJSON('rn_final_personal',null,[]);
let remoteCourse=[];
try{localStorage.removeItem('rn_final_remote_course')}catch(e){}
if(!progress||typeof progress!=='object'||Array.isArray(progress))progress={};
if(!stats||typeof stats!=='object'||Array.isArray(stats))stats={reviews:0,streak:0,lastDay:'',days:{}};
if(!Array.isArray(personal))personal=[];

let externalCourse=[], externalGrammar=[], externalLoaded=new Set(), externalLoading=new Map();
const JLPT_COUNTS={N5:662,N4:632,N3:1784,N2:1793,N1:3463};
const rawBaseCards=D.buildCards().filter(c=>['Vokabeln','Grammatik','Hiragana','Katakana'].includes(c.deck));
const seenBaseGrammar=new Set();
const baseCards=rawBaseCards.filter(c=>{if(c.deck!=='Grammatik')return true;const k=c.level+'|'+c.front;if(seenBaseGrammar.has(k))return false;seenBaseGrammar.add(k);return true});
const sentencePack=[
['s1','N5','私は毎朝七時に起きます。','わたしはまいあさしちじにおきます。','I get up at seven every morning.'],['s2','N5','日本語を勉強しています。','にほんごをべんきょうしています。','I am studying Japanese.'],['s3','N5','駅はどこですか。','えきはどこですか。','Where is the station?'],['s4','N5','水をください。','みずをください。','Water, please.'],['s5','N5','明日、友達と映画を見ます。','あした、ともだちとえいがをみます。','Tomorrow I will watch a movie with a friend.'],['s6','N5','この本はとても面白いです。','このほんはとてもおもしろいです。','This book is very interesting.'],['s7','N5','今日は学校へ行きません。','きょうはがっこうへいきません。','I am not going to school today.'],['s8','N5','猫が机の下にいます。','ねこがつくえのしたにいます。','There is a cat under the desk.'],['s9','N5','何時に寝ますか。','なんじにねますか。','What time do you go to bed?'],['s10','N5','一緒に昼ご飯を食べましょう。','いっしょにひるごはんをたべましょう。','Let’s have lunch together.'],
['s11','N4','日本へ行ったことがあります。','にほんへいったことがあります。','I have been to Japan before.'],['s12','N4','音楽を聞きながら勉強します。','おんがくをききながらべんきょうします。','I study while listening to music.'],['s13','N4','雨が降っても行きます。','あめがふってもいきます。','I will go even if it rains.'],['s14','N4','毎日少しずつ読むようにしています。','まいにちすこしずつよむようにしています。','I make sure to read a little every day.'],['s15','N4','宿題をしてからテレビを見ました。','しゅくだいをしてからテレビをみました。','I watched TV after doing my homework.'],['s16','N4','この薬は食事の後で飲んでください。','このくすりはしょくじのあとでのんでください。','Please take this medicine after a meal.'],['s17','N4','もっと早く寝たほうがいいです。','もっとはやくねたほうがいいです。','You should go to bed earlier.'],['s18','N4','来年日本で働くつもりです。','らいねんにほんではたらくつもりです。','I intend to work in Japan next year.'],
['s19','N3','理由をもう少し詳しく説明してください。','りゆうをもうすこしくわしくせつめいしてください。','Please explain the reason in a little more detail.'],['s20','N3','状況によって予定を変更するかもしれません。','じょうきょうによってよていをへんこうするかもしれません。','We may change the plan depending on the situation.'],['s21','N3','この問題についてどう思いますか。','このもんだいについてどうおもいますか。','What do you think about this issue?'],['s22','N3','電車が遅れたため、会議に間に合いませんでした。','でんしゃがおくれたため、かいぎにまにあいませんでした。','Because the train was delayed, I did not make it to the meeting in time.'],['s23','N3','日本に住むようになってから、魚をよく食べます。','にほんにすむようになってから、さかなをよくたべます。','Since I started living in Japan, I eat fish often.'],['s24','N3','彼が来るかどうかまだ分かりません。','かれがくるかどうかまだわかりません。','I still do not know whether he will come.'],['s25','N2','経験を積むにつれて、自分の弱点が見えてきました。','けいけんをつむにつれて、じぶんのじゃくてんがみえてきました。','As I gained experience, I began to see my own weaknesses.'],['s26','N2','結果にかかわらず、最後までやり抜くつもりです。','けっかにかかわらず、さいごまでやりぬくつもりです。','Regardless of the result, I intend to see it through to the end.'],['s27','N2','この制度は若者だけでなく、高齢者にも利用されています。','このせいどはわかものだけでなく、こうれいしゃにもりようされています。','This system is used not only by young people but also by older people.'],['s28','N1','彼の発言は誤解を招きかねない。','かれのはつげんはごかいをまねきかねない。','His remark could easily lead to misunderstanding.'],['s29','N1','状況を把握した上で、最終的な判断を下すべきだ。','じょうきょうをはあくしたうえで、さいしゅうてきなはんだんをくだすべきだ。','A final decision should be made after fully understanding the situation.'],['s30','N1','努力なくして大きな成果は望めない。','どりょくなくしておおきなせいかはのぞめない。','Without effort, one cannot expect major results.']
].map(([id,level,jp,reading,en])=>({id,level,jp,reading,en}));
const grammarEN={'A は B です':'A is B.','～ですか':'polite question form','A の B':'B of A / A’s B','A も B':'A also B','～を + Verb':'marks the direct object','～に':'time / destination / location of existence','～へ':'direction / destination','～で':'place of action / means','～と':'with / and / quotation','～から / ～まで':'from / until','あります / います':'there is / there are','～たいです':'want to do','～てください':'please do','～てもいいです':'may / be allowed to','～てはいけません':'must not','～ませんか':'invitation: won’t you…?','～ましょう':'let’s…','～ながら':'while doing','～と思います':'I think that…','～と思う':'think that…','～なければならない':'must / have to','～たことがある':'have done before','～ようにする':'make sure to / try to','～ことになる':'it is decided / it turns out that','～わけではない':'it is not that…','～に違いない':'must surely be','～ものの':'although','～に伴って':'along with / accompanying','～を皮切りに':'starting with','～に堪えない':'cannot bear / too… to endure','～を余儀なくされる':'be forced to','～と言う':'say that','～たり～たりする':'do things such as…','～なくてもいい':'do not have to','～かもしれない':'might / maybe','～でしょう':'probably / right?','～そうだ（様態）':'looks like / seems','～そうだ（伝聞）':'I hear that…','～ようと思う':'intend to','～予定だ':'be scheduled / planned','～つもりだ':'intend to','～ほうがいい':'had better / should','～すぎる':'too much / excessively','～やすい':'easy to','～にくい':'hard to','～始める':'start doing','～終わる':'finish doing','～続ける':'continue doing','～てみる':'try doing','～ておく':'do in advance','～てしまう':'finish completely / regrettably do','～てある':'has been done intentionally','～ているところだ':'be in the middle of doing','～るところだ':'be just about to do','～たところだ':'have just done','～ようになる':'come to / become','～ので':'because','～のに':'although','～し':'and / besides / because','～なら':'if it is / if we are talking about','～たら':'if / when','～ば':'if','～と':'whenever / when','～ても':'even if','～しか～ない':'only','～でも':'for example / even','～について':'about / concerning','～によると':'according to','～までに':'by / no later than','～間に':'while / during','～前に':'before','～後で':'after / later','～ために':'in order to / for','～方':'way of doing','～かどうか':'whether or not','～ようだ':'it seems / appears','～によって':'depending on / by means of','～ため':'because of / due to','～につれて':'as / in proportion as','～にかかわらず':'regardless of / irrespective of','～だけでなく～も':'not only ... but also ...','～に違いない':'must surely be','～ものの':'although / even though','～に伴って':'along with / as ... changes','～かねない':'could / might (undesirable result)','～た上で':'after doing / once ... has been done','～なくして':'without / if not for'};
const GRAMMAR_LESSONS={
'A は B です':{explain:'Use は to mark the topic and です to make a polite statement. Think: “As for A, it is B.”',example:'私は学生です。',translation:'I am a student.'},
'～ですか':{explain:'Add か to the end of a polite sentence to make a question. The word order normally stays the same.',example:'学生ですか。',translation:'Are you a student?'},
'A の B':{explain:'の links two nouns. A describes, owns, or belongs with B. The second noun is the main noun.',example:'日本の本です。',translation:'It is a Japanese book.'},
'A も B':{explain:'も replaces は or が when you mean “also / too”.',example:'私も学生です。',translation:'I am a student too.'},
'～を + Verb':{explain:'を marks the direct object of an action: the thing you eat, read, watch, buy, and so on.',example:'水を飲みます。',translation:'I drink water.'},
'～に':{explain:'に commonly marks a specific time, a destination, or the place where something exists.',example:'七時に起きます。',translation:'I get up at seven.'},
'～へ':{explain:'へ marks direction toward a destination. As a particle it is pronounced “e”.',example:'日本へ行きます。',translation:'I go to Japan.'},
'～で':{explain:'で marks the place where an action happens, or the means used to do something.',example:'学校で勉強します。',translation:'I study at school.'},
'～と':{explain:'と can mean “with”, join nouns as “and”, or mark quoted speech depending on context.',example:'友達と話します。',translation:'I speak with a friend.'},
'～から / ～まで':{explain:'から marks a starting point (“from”), while まで marks an end point (“until / to”).',example:'九時から五時までです。',translation:'It is from nine until five.'},
'あります / います':{explain:'Use あります for inanimate things and います for people and animals when saying that something exists.',example:'猫がいます。',translation:'There is a cat.'},
'～たいです':{explain:'Attach たい to the verb stem to say that you want to do something.',example:'日本へ行きたいです。',translation:'I want to go to Japan.'},
'～てください':{explain:'Use the て-form + ください for a polite request: “please do …”.',example:'見てください。',translation:'Please look.'},
'～てもいいです':{explain:'Use the て-form + もいいです to say that an action is allowed or to ask permission.',example:'ここで食べてもいいです。',translation:'You may eat here.'},
'～てはいけません':{explain:'Use the て-form + はいけません to say that something must not be done.',example:'ここで写真を撮ってはいけません。',translation:'You must not take photos here.'},
'～ませんか':{explain:'A negative polite question with ませんか is a soft invitation: “Won’t you …?”',example:'一緒に食べませんか。',translation:'Would you like to eat together?'},
'～ましょう':{explain:'Use the verb stem + ましょう to suggest doing something together: “Let’s …”.',example:'一緒に食べましょう。',translation:'Let’s eat together.'},
'～たことがある':{explain:'Past plain form + ことがある expresses past experience: “have done … before”.',example:'日本へ行ったことがあります。',translation:'I have been to Japan before.'},
'～ながら':{explain:'Attach ながら to the verb stem to describe two actions happening at the same time.',example:'音楽を聞きながら勉強します。',translation:'I study while listening to music.'},
'～ても':{explain:'The て-form + も can mean “even if / even though”.',example:'雨が降っても行きます。',translation:'I will go even if it rains.'},
'～ようにする':{explain:'Use ようにする for a deliberate habit or effort: “make sure to / try to …”.',example:'毎日読むようにしています。',translation:'I make sure to read every day.'},
'～ほうがいい':{explain:'Past/plain form + ほうがいい gives advice: “you should / had better …”.',example:'早く寝たほうがいいです。',translation:'You should go to bed early.'},
'～つもりだ':{explain:'Plain form + つもり expresses an intention or plan.',example:'日本で働くつもりです。',translation:'I intend to work in Japan.'},
'～かもしれない':{explain:'Plain form + かもしれない expresses possibility: “might / maybe”.',example:'予定を変更するかもしれません。',translation:'We may change the plan.'},
'～について':{explain:'Noun + について means “about / concerning” and introduces a topic of discussion.',example:'この問題について話します。',translation:'I will talk about this issue.'},
'～ために':{explain:'ために can express purpose (“in order to”) or cause (“because of”), depending on the form before it.',example:'勉強するために図書館へ行きます。',translation:'I go to the library in order to study.'},
'～かどうか':{explain:'Use かどうか after a plain clause to mean “whether or not”.',example:'来るかどうか分かりません。',translation:'I do not know whether he will come.'},
'～によって':{explain:'Noun + によって can mean “depending on”, “by means of”, or identify an agent/cause. At N3, learn the meaning from context rather than translating it with one fixed English word.',example:'状況によって予定を変更します。',translation:'We change the plan depending on the situation.'},
'～ため':{explain:'A plain clause or noun + の + ため can state a reason or cause. It is more formal and objective than から or ので.',example:'電車が遅れたため、会議に間に合いませんでした。',translation:'Because the train was delayed, I did not make it to the meeting in time.'},
'～につれて':{explain:'Attach につれて to a noun or dictionary-form verb to describe two developments that change together over time. It is used for gradual, naturally linked change rather than a single event.',example:'経験を積むにつれて、自信がついてきました。',translation:'As I gained experience, I gradually became more confident.'},
'～にかかわらず':{explain:'Noun + にかかわらず means that the result does not change despite the stated condition: “regardless of / irrespective of”. It is common in formal instructions and statements.',example:'結果にかかわらず、最後まで続けます。',translation:'Regardless of the result, I will continue to the end.'},
'～だけでなく～も':{explain:'Use A だけでなく B も to add a second item emphatically: “not only A, but also B”. The B item normally carries も.',example:'若者だけでなく、高齢者も利用しています。',translation:'Not only young people but also older people use it.'},
'～に違いない':{explain:'Plain form + に違いない expresses a strong conclusion based on evidence: “must surely / must be”. It is stronger than でしょう and is not used for a simple personal intention.',example:'彼はそのことを知っているに違いない。',translation:'He must know about it.'},
'～ものの':{explain:'Plain form + ものの introduces a real fact followed by an unexpected or contrasting result. It is more formal and written than のに.',example:'買ったものの、まだ使っていません。',translation:'Although I bought it, I have not used it yet.'},
'～に伴って':{explain:'Noun / dictionary-form verb + に伴って describes one change occurring together with another related change. It is relatively formal and common in explanatory writing.',example:'人口の増加に伴って、交通量も増えました。',translation:'As the population increased, traffic also increased.'},
'～かねない':{explain:'Attach かねない to the verb stem to warn that an undesirable outcome could realistically happen. It is formal and often used when discussing risks or consequences.',example:'その発言は誤解を招きかねない。',translation:'That remark could lead to misunderstanding.'},
'～た上で':{explain:'Past plain form + 上で means that one action is completed first and the following action or decision is made on that basis. It is common in formal instructions and decision-making.',example:'状況を確認した上で、判断してください。',translation:'Please make a decision after checking the situation.'},
'～なくして':{explain:'Noun + なくして expresses a strong formal condition: without A, B cannot be achieved or exist. It is stronger and more rhetorical than simply using なしで.',example:'努力なくして成功は望めない。',translation:'Without effort, success cannot be expected.'}
};
const FOUNDATION_WORDS=[
{id:'fv-n5-1',level:'N5',front:'毎朝',reading:'まいあさ · maiasa',meaning:'every morning',deck:'Vokabeln',example:'毎朝七時に起きます。',exampleEn:'I get up at seven every morning.'},
{id:'fv-n5-2',level:'N5',front:'七時',reading:'しちじ · shichiji',meaning:'seven o’clock',deck:'Vokabeln',example:'七時に起きます。',exampleEn:'I get up at seven.'},
{id:'fv-n5-3',level:'N5',front:'勉強する',reading:'べんきょうする · benkyou suru',meaning:'to study',deck:'Vokabeln',example:'日本語を勉強します。',exampleEn:'I study Japanese.'},
{id:'fv-n5-4',level:'N5',front:'映画',reading:'えいが · eiga',meaning:'movie / film',deck:'Vokabeln',example:'映画を見ます。',exampleEn:'I watch a movie.'},
{id:'fv-n5-5',level:'N5',front:'猫',reading:'ねこ · neko',meaning:'cat',deck:'Vokabeln',example:'猫がいます。',exampleEn:'There is a cat.'},
{id:'fv-n5-6',level:'N5',front:'何時',reading:'なんじ · nanji',meaning:'what time',deck:'Vokabeln',example:'何時に寝ますか。',exampleEn:'What time do you go to bed?'},
{id:'fv-n5-7',level:'N5',front:'一緒に',reading:'いっしょに · issho ni',meaning:'together',deck:'Vokabeln',example:'一緒に食べましょう。',exampleEn:'Let’s eat together.'},
{id:'fv-n5-8',level:'N5',front:'昼ご飯',reading:'ひるごはん · hirugohan',meaning:'lunch',deck:'Vokabeln',example:'昼ご飯を食べます。',exampleEn:'I eat lunch.'},
{id:'fv-n4-1',level:'N4',front:'音楽',reading:'おんがく · ongaku',meaning:'music',deck:'Vokabeln',example:'音楽を聞きます。',exampleEn:'I listen to music.'},
{id:'fv-n4-2',level:'N4',front:'毎日',reading:'まいにち · mainichi',meaning:'every day',deck:'Vokabeln',example:'毎日日本語を勉強します。',exampleEn:'I study Japanese every day.'},
{id:'fv-n4-3',level:'N4',front:'少しずつ',reading:'すこしずつ · sukoshi zutsu',meaning:'little by little',deck:'Vokabeln',example:'少しずつ読みます。',exampleEn:'I read a little at a time.'},
{id:'fv-n4-4',level:'N4',front:'宿題',reading:'しゅくだい · shukudai',meaning:'homework',deck:'Vokabeln',example:'宿題をします。',exampleEn:'I do my homework.'},
{id:'fv-n4-5',level:'N4',front:'テレビ',reading:'テレビ · terebi',meaning:'television / TV',deck:'Vokabeln',example:'テレビを見ます。',exampleEn:'I watch TV.'},
{id:'fv-n4-6',level:'N4',front:'薬',reading:'くすり · kusuri',meaning:'medicine',deck:'Vokabeln',example:'薬を飲みます。',exampleEn:'I take medicine.'},
{id:'fv-n4-7',level:'N4',front:'食事',reading:'しょくじ · shokuji',meaning:'meal',deck:'Vokabeln',example:'食事の後で薬を飲みます。',exampleEn:'I take medicine after a meal.'},
{id:'fv-n4-8',level:'N4',front:'後',reading:'あと · ato',meaning:'after / later',deck:'Vokabeln',example:'食事の後で出かけます。',exampleEn:'I go out after the meal.'},
{id:'fv-n4-9',level:'N4',front:'もっと',reading:'もっと · motto',meaning:'more',deck:'Vokabeln',example:'もっと早く寝ます。',exampleEn:'I go to bed earlier.'},
{id:'fv-n4-10',level:'N4',front:'早く',reading:'はやく · hayaku',meaning:'early / quickly',deck:'Vokabeln',example:'今日は早く寝ます。',exampleEn:'I will go to bed early today.'},
{id:'fv-n4-11',level:'N4',front:'来年',reading:'らいねん · rainen',meaning:'next year',deck:'Vokabeln',example:'来年日本へ行きます。',exampleEn:'I will go to Japan next year.'},
{id:'fv-n4-12',level:'N4',front:'働く',reading:'はたらく · hataraku',meaning:'to work',deck:'Vokabeln',example:'日本で働きます。',exampleEn:'I work in Japan.'},
{id:'fv-n4-13',level:'N4',front:'降る',reading:'ふる · furu',meaning:'to fall (rain / snow)',deck:'Vokabeln',example:'雨が降っています。',exampleEn:'It is raining.'},
{id:'fv-n4-14',level:'N4',front:'雨',reading:'あめ · ame',meaning:'rain',deck:'Vokabeln',example:'今日は雨です。',exampleEn:'It is raining today.'},
{id:'fv-n3-1',level:'N3',front:'理由',reading:'りゆう · riyū',meaning:'reason',deck:'Vokabeln',example:'理由を説明してください。',exampleEn:'Please explain the reason.'},
{id:'fv-n3-2',level:'N3',front:'詳しい',reading:'くわしい · kuwashii',meaning:'detailed / knowledgeable',deck:'Vokabeln',example:'詳しい説明をお願いします。',exampleEn:'Please give a detailed explanation.'},
{id:'fv-n3-3',level:'N3',front:'説明する',reading:'せつめいする · setsumei suru',meaning:'to explain',deck:'Vokabeln',example:'理由を説明します。',exampleEn:'I will explain the reason.'},
{id:'fv-n3-4',level:'N3',front:'状況',reading:'じょうきょう · jōkyō',meaning:'situation / circumstances',deck:'Vokabeln',example:'状況を確認します。',exampleEn:'I will check the situation.'},
{id:'fv-n3-5',level:'N3',front:'予定',reading:'よてい · yotei',meaning:'plan / schedule',deck:'Vokabeln',example:'予定を変更しました。',exampleEn:'I changed the plan.'},
{id:'fv-n3-6',level:'N3',front:'変更する',reading:'へんこうする · henkō suru',meaning:'to change / modify',deck:'Vokabeln',example:'予定を変更します。',exampleEn:'I will change the plan.'},
{id:'fv-n3-7',level:'N3',front:'問題',reading:'もんだい · mondai',meaning:'problem / issue / question',deck:'Vokabeln',example:'この問題について話します。',exampleEn:'I will talk about this issue.'},
{id:'fv-n3-8',level:'N3',front:'電車',reading:'でんしゃ · densha',meaning:'train',deck:'Vokabeln',example:'電車が遅れました。',exampleEn:'The train was delayed.'},
{id:'fv-n3-9',level:'N3',front:'遅れる',reading:'おくれる · okureru',meaning:'to be late / delayed',deck:'Vokabeln',example:'電車が遅れました。',exampleEn:'The train was delayed.'},
{id:'fv-n3-10',level:'N3',front:'会議',reading:'かいぎ · kaigi',meaning:'meeting / conference',deck:'Vokabeln',example:'会議は三時からです。',exampleEn:'The meeting starts at three.'},
{id:'fv-n3-11',level:'N3',front:'間に合う',reading:'まにあう · maniau',meaning:'to be in time / make it in time',deck:'Vokabeln',example:'会議に間に合いました。',exampleEn:'I made it to the meeting in time.'},
{id:'fv-n3-12',level:'N3',front:'住む',reading:'すむ · sumu',meaning:'to live / reside',deck:'Vokabeln',example:'日本に住んでいます。',exampleEn:'I live in Japan.'},
{id:'fv-n3-13',level:'N3',front:'魚',reading:'さかな · sakana',meaning:'fish',deck:'Vokabeln',example:'魚をよく食べます。',exampleEn:'I often eat fish.'},
{id:'fv-n3-14',level:'N3',front:'彼',reading:'かれ · kare',meaning:'he / boyfriend',deck:'Vokabeln',example:'彼は明日来ます。',exampleEn:'He will come tomorrow.'},
{id:'fv-n3-15',level:'N3',front:'分かる',reading:'わかる · wakaru',meaning:'to understand / know',deck:'Vokabeln',example:'理由が分かりません。',exampleEn:'I do not know the reason.'},
{id:'fv-n2-1',level:'N2',front:'経験',reading:'けいけん · keiken',meaning:'experience',deck:'Vokabeln',example:'仕事を通して経験を積みました。',exampleEn:'I gained experience through my work.'},
{id:'fv-n2-2',level:'N2',front:'積む',reading:'つむ · tsumu',meaning:'to accumulate / gain',deck:'Vokabeln',example:'経験を積むことが大切です。',exampleEn:'It is important to gain experience.'},
{id:'fv-n2-3',level:'N2',front:'自分',reading:'じぶん · jibun',meaning:'oneself / myself / yourself',deck:'Vokabeln',example:'自分の考えを説明しました。',exampleEn:'I explained my own opinion.'},
{id:'fv-n2-4',level:'N2',front:'弱点',reading:'じゃくてん · jakuten',meaning:'weak point / weakness',deck:'Vokabeln',example:'自分の弱点を知ることも大切です。',exampleEn:'It is also important to know your weaknesses.'},
{id:'fv-n2-5',level:'N2',front:'見えてくる',reading:'みえてくる · miete kuru',meaning:'to become apparent / come into view',deck:'Vokabeln',example:'問題点が少しずつ見えてきました。',exampleEn:'The problems gradually became apparent.'},
{id:'fv-n2-6',level:'N2',front:'結果',reading:'けっか · kekka',meaning:'result / outcome',deck:'Vokabeln',example:'結果を確認してください。',exampleEn:'Please check the result.'},
{id:'fv-n2-7',level:'N2',front:'最後',reading:'さいご · saigo',meaning:'last / end',deck:'Vokabeln',example:'最後まで続けます。',exampleEn:'I will continue to the end.'},
{id:'fv-n2-8',level:'N2',front:'やり抜く',reading:'やりぬく · yarinuku',meaning:'to carry through / see through to the end',deck:'Vokabeln',example:'難しくても最後までやり抜きます。',exampleEn:'Even if it is difficult, I will see it through to the end.'},
{id:'fv-n2-9',level:'N2',front:'制度',reading:'せいど · seido',meaning:'system / institution',deck:'Vokabeln',example:'新しい制度が始まりました。',exampleEn:'A new system has started.'},
{id:'fv-n2-10',level:'N2',front:'若者',reading:'わかもの · wakamono',meaning:'young person / young people',deck:'Vokabeln',example:'多くの若者が参加しました。',exampleEn:'Many young people participated.'},
{id:'fv-n2-11',level:'N2',front:'高齢者',reading:'こうれいしゃ · kōreisha',meaning:'older person / elderly people',deck:'Vokabeln',example:'高齢者にも使いやすい制度です。',exampleEn:'It is a system that is easy for older people to use.'},
{id:'fv-n2-12',level:'N2',front:'利用する',reading:'りようする · riyō suru',meaning:'to use / make use of',deck:'Vokabeln',example:'多くの人がこの制度を利用しています。',exampleEn:'Many people use this system.'},
{id:'fv-n1-1',level:'N1',front:'発言',reading:'はつげん · hatsugen',meaning:'remark / statement',deck:'Vokabeln',example:'その発言は誤解を招く可能性があります。',exampleEn:'That remark may cause misunderstanding.'},
{id:'fv-n1-2',level:'N1',front:'誤解',reading:'ごかい · gokai',meaning:'misunderstanding',deck:'Vokabeln',example:'説明不足が誤解を招きました。',exampleEn:'The insufficient explanation caused a misunderstanding.'},
{id:'fv-n1-3',level:'N1',front:'招く',reading:'まねく · maneku',meaning:'to cause / bring about / invite',deck:'Vokabeln',example:'不用意な発言は混乱を招きます。',exampleEn:'Careless remarks cause confusion.'},
{id:'fv-n1-4',level:'N1',front:'把握する',reading:'はあくする · haaku suru',meaning:'to grasp / understand fully',deck:'Vokabeln',example:'まず状況を把握する必要があります。',exampleEn:'First, it is necessary to grasp the situation.'},
{id:'fv-n1-5',level:'N1',front:'最終的',reading:'さいしゅうてき · saishūteki',meaning:'final / ultimate',deck:'Vokabeln',example:'最終的な判断は明日発表します。',exampleEn:'The final decision will be announced tomorrow.'},
{id:'fv-n1-6',level:'N1',front:'判断',reading:'はんだん · handan',meaning:'judgment / decision',deck:'Vokabeln',example:'十分な情報を基に判断します。',exampleEn:'I will make a decision based on sufficient information.'},
{id:'fv-n1-7',level:'N1',front:'下す',reading:'くだす · kudasu',meaning:'to make / hand down (a decision)',deck:'Vokabeln',example:'慎重に判断を下すべきです。',exampleEn:'A decision should be made carefully.'},
{id:'fv-n1-8',level:'N1',front:'努力',reading:'どりょく · doryoku',meaning:'effort / endeavor',deck:'Vokabeln',example:'努力を続けることが大切です。',exampleEn:'It is important to keep making an effort.'},
{id:'fv-n1-9',level:'N1',front:'大きな',reading:'おおきな · ōkina',meaning:'big / major',deck:'Vokabeln',example:'その改革は大きな変化をもたらしました。',exampleEn:'The reform brought about a major change.'},
{id:'fv-n1-10',level:'N1',front:'成果',reading:'せいか · seika',meaning:'result / achievement / outcome',deck:'Vokabeln',example:'長年の研究が大きな成果につながりました。',exampleEn:'Years of research led to a major achievement.'},
{id:'fv-n1-11',level:'N1',front:'望む',reading:'のぞむ · nozomu',meaning:'to hope for / expect / desire',deck:'Vokabeln',example:'すぐに成果を望むのは難しいです。',exampleEn:'It is difficult to expect immediate results.'}
];
const FOUNDATION_GRAMMAR=[
{id:'fg-n3-niyotte',level:'N3',front:'～によって',reading:'ni yotte',meaning:'depending on / by means of',deck:'Grammatik',section:'N3 · Conditions & means'},
{id:'fg-n3-tame',level:'N3',front:'～ため',reading:'tame',meaning:'because of / due to',deck:'Grammatik',section:'N3 · Cause & reason'},
{id:'fg-n2-tsurete',level:'N2',front:'～につれて',reading:'ni tsurete',meaning:'as / in proportion as',deck:'Grammatik',section:'N2 · Gradual change'},
{id:'fg-n2-kakawarazu',level:'N2',front:'～にかかわらず',reading:'ni kakawarazu',meaning:'regardless of / irrespective of',deck:'Grammatik',section:'N2 · Concession'},
{id:'fg-n2-dakedenaku',level:'N2',front:'～だけでなく～も',reading:'dake de naku ... mo',meaning:'not only ... but also ...',deck:'Grammatik',section:'N2 · Addition & emphasis'},
{id:'fg-n1-kanenai',level:'N1',front:'～かねない',reading:'kanenai',meaning:'could / might (undesirable result)',deck:'Grammatik',section:'N1 · Risk & consequence'},
{id:'fg-n1-uede',level:'N1',front:'～た上で',reading:'ta ue de',meaning:'after doing / once ... has been done',deck:'Grammatik',section:'N1 · Sequence & basis'},
{id:'fg-n1-nakushite',level:'N1',front:'～なくして',reading:'nakushite',meaning:'without / if not for',deck:'Grammatik',section:'N1 · Necessary condition'}
];

const SENTENCE_CHUNKS={
 s1:['私','は','毎朝','七時','に','起きます。'],s2:['日本語','を','勉強しています。'],s3:['駅','は','どこ','です','か。'],s4:['水','を','ください。'],s5:['明日、','友達','と','映画','を','見ます。'],s6:['この','本','は','とても','面白い','です。'],s7:['今日','は','学校','へ','行きません。'],s8:['猫','が','机','の','下','に','います。'],s9:['何時','に','寝ます','か。'],s10:['一緒に','昼ご飯','を','食べましょう。'],
 s11:['日本','へ','行ったことが','あります。'],s12:['音楽','を','聞きながら','勉強します。'],s13:['雨','が','降っても','行きます。'],s14:['毎日','少しずつ','読むように','しています。'],s15:['宿題','を','してから','テレビ','を','見ました。'],s16:['この','薬','は','食事','の','後で','飲んでください。'],s17:['もっと','早く','寝たほうが','いいです。'],s18:['来年','日本','で','働くつもり','です。'],
 s19:['理由','を','もう少し','詳しく','説明してください。'],s20:['状況','によって','予定','を','変更する','かもしれません。'],s21:['この','問題','について','どう','思います','か。'],s22:['電車','が','遅れたため、','会議','に','間に合いませんでした。'],s23:['日本','に','住むようになってから、','魚','を','よく','食べます。'],s24:['彼','が','来るかどうか','まだ','分かりません。'],
 s25:['経験','を','積むにつれて、','自分','の','弱点','が','見えてきました。'],
 s26:['結果','にかかわらず、','最後まで','やり抜く','つもりです。'],
 s27:['この','制度','は','若者','だけでなく、','高齢者','にも','利用されています。'],
 s28:['彼','の','発言','は','誤解','を','招きかねない。'],
 s29:['状況','を','把握した上で、','最終的な','判断','を','下すべきだ。'],
 s30:['努力','なくして','大きな','成果','は','望めない。']
};
const SENTENCE_RULES={
 s1:{v:['私','毎朝','七時','起きる'],g:['～に']},s2:{v:['日本語','勉強する'],g:['～を + Verb']},s3:{v:['駅','どこ'],g:['～ですか']},s4:{v:['水'],g:['～てください']},s5:{v:['明日','友達','映画','見る'],g:['～と','～を + Verb']},
 s6:{v:['本','面白い'],g:['A は B です']},s7:{v:['今日','学校','行く'],g:['～へ']},s8:{v:['猫','机','下'],g:['あります / います','～に']},s9:{v:['何時','寝る'],g:['～ですか','～に']},s10:{v:['一緒に','昼ご飯','食べる'],g:['～ましょう','～を + Verb']},
 s11:{v:['日本','行く'],g:['～たことがある','～へ']},s12:{v:['音楽','聞く','勉強する'],g:['～ながら','～を + Verb']},s13:{v:['雨','降る','行く'],g:['～ても']},s14:{v:['毎日','少しずつ','読む'],g:['～ようにする']},s15:{v:['宿題','テレビ','見る'],g:['～後で','～を + Verb']},s16:{v:['薬','食事','後','飲む'],g:['～てください','～後で']},s17:{v:['もっと','早く','寝る'],g:['～ほうがいい']},s18:{v:['来年','日本','働く'],g:['～つもりだ','～で']},
 s19:{v:['理由','詳しい','説明する'],g:['～てください']},s20:{v:['状況','予定','変更する'],g:['～によって','～かもしれない']},s21:{v:['問題','思う'],g:['～について','～ですか']},s22:{v:['電車','遅れる','会議','間に合う'],g:['～ため','～に']},s23:{v:['日本','住む','魚','食べる'],g:['～ようになる','～に','～を + Verb']},s24:{v:['彼','来る','分かる'],g:['～かどうか']},
 s25:{v:['経験','積む','自分','弱点','見えてくる'],g:['～につれて','A の B']},
 s26:{v:['結果','最後','やり抜く'],g:['～にかかわらず','～つもりだ']},
 s27:{v:['制度','若者','高齢者','利用する'],g:['～だけでなく～も','～に']},
 s28:{v:['彼','発言','誤解','招く'],g:['A の B','～を + Verb','～かねない']},
 s29:{v:['状況','把握する','最終的','判断','下す'],g:['～た上で','～を + Verb']},
 s30:{v:['努力','大きな','成果','望む'],g:['～なくして']}
};
const N4_EXAMPLE_EN={
'～ながら':'I study while listening to music.',
'～と思います':'I think it will rain tomorrow.',
'～なければならない':'I have to study.',
'～たことがある':'I have been to Japan before.',
'～と思う':'I think it will rain tomorrow.',
'～と言う':'The teacher said that tomorrow is a day off.',
'～たり～たりする':'On my days off, I do things like read books and watch movies.',
'～なくてもいい':'You do not have to come tomorrow.',
'～かもしれない':'It might rain in the afternoon.',
'～でしょう':'It will probably be cold tomorrow.',
'～そうだ（様態）':'It looks like it is going to rain.',
'～そうだ（伝聞）':'I heard that Mr. Tanaka is not coming.',
'～ようと思う':'I am thinking of going to Japan next year.',
'～予定だ':'I am scheduled to move next month.',
'～つもりだ':'I intend to study every day.',
'～ほうがいい':'You should go to bed early.',
'～すぎる':'I ate too much.',
'～やすい':'This book is easy to read.',
'～にくい':'This kanji is hard to remember.',
'～始める':'It started to rain.',
'～終わる':'I finished reading the book.',
'～続ける':'I will continue studying Japanese.',
'～てみる':'I will try this dish.',
'～ておく':'I will book the hotel in advance.',
'～てしまう':'I accidentally forgot my wallet.',
'～てある':'The window has been left open intentionally.',
'～ているところだ':'I am eating right now.',
'～るところだ':'I am just about to go out.',
'～たところだ':'I just got home.',
'～ようになる':'I became able to speak Japanese.',
'～ようにする':'I make sure to walk every day.',
'～ので':'I am not going out because it is raining.',
'～のに':'Even though I studied, I forgot it.',
'～し':'This shop is cheap, and the food is good too.',
'～なら':'If you are talking about Kyoto, spring is recommended.',
'～たら':'I will call you when I get home.',
'～ば':'If I have time, I will go.',
'～と':'When spring comes, it gets warmer.',
'～ても':'I will go even if it rains.',
'～しか～ない':'I only have one thousand yen.',
'～でも':'Would you like to have some tea or something?',
'～について':'I study Japanese culture.',
'～によると':'According to the weather forecast, it will rain tomorrow.',
'～までに':'Please come home by five o’clock.',
'～間に':'I study while the child is sleeping.',
'～前に':'I brush my teeth before going to bed.',
'～後で':'I go shopping after work.',
'～ために':'I am studying in order to work in Japan.',
'～方':'Please teach me how to use it.',
'～かどうか':'I have not decided yet whether I will go.',
'～ようだ':'He seems tired.',
};
function lessonInfo(c){
  if(GRAMMAR_LESSONS[c.front])return {...GRAMMAR_LESSONS[c.front],formation:c.formation||c.front};
  const meaning=grammarEN[c.front]||((c.community&&c.meaning)||'Grammar pattern');
  const translation=c.exampleEn||N4_EXAMPLE_EN[c.front]||'';
  return {explain:`${meaning}. Study the form in context, then practise recognising and producing the pattern.`,formation:c.formation||c.front,example:c.example||'',translation};
}
const offlineEN={
'私':'I / me','あなた':'you','人':'person','日本':'Japan','日本語':'Japanese','先生':'teacher','学生':'student','友達':'friend','家族':'family','水':'water','お茶':'tea','ご飯':'rice / meal','食べる':'to eat','飲む':'to drink','行く':'to go','来る':'to come','見る':'to see / watch','聞く':'to hear / listen / ask','話す':'to speak / talk','読む':'to read','書く':'to write','買う':'to buy','大きい':'big','小さい':'small','新しい':'new','古い':'old','良い':'good','悪い':'bad','今日':'today','明日':'tomorrow','昨日':'yesterday','今':'now','朝':'morning','夜':'night / evening','駅':'station','学校':'school','病院':'hospital','店':'shop / store','右':'right','左':'left','上':'above / on top','下':'below / under','中':'inside / middle','外':'outside','いくら':'how much','どこ':'where','何':'what','誰':'who','ありがとう':'thank you','すみません':'excuse me / sorry','お願いします':'please','大丈夫':'okay / all right',
'必要':'necessary / needed','予定':'plan / schedule','経験':'experience','説明':'explanation','準備':'preparation','続ける':'to continue','比べる':'to compare','選ぶ':'to choose','状況':'situation','理由':'reason','影響':'influence / effect','方法':'method / way','関係':'relationship / connection','可能':'possible','判断':'judgment / decision','維持':'maintenance / to maintain','傾向':'tendency / trend','対応':'response / handling','概念':'concept','妥当':'valid / appropriate','遂行':'execution / carrying out','顕著':'remarkable / notable',
'会う':'to meet','開ける':'to open','閉める':'to close','起きる':'to get up / wake up','寝る':'to sleep / go to bed','働く':'to work','休む':'to rest / take a day off','待つ':'to wait','持つ':'to hold / have','使う':'to use','作る':'to make','入る':'to enter','出る':'to leave / come out','座る':'to sit','立つ':'to stand','分かる':'to understand','教える':'to teach / tell','習う':'to learn from someone','勉強する':'to study','始める':'to begin / start','終わる':'to finish / end','住む':'to live / reside','歩く':'to walk','走る':'to run','泳ぐ':'to swim','乗る':'to ride / get on','降りる':'to get off','曲がる':'to turn','着く':'to arrive','帰る':'to return / go home','切る':'to cut','洗う':'to wash','掃除する':'to clean','料理する':'to cook','電話する':'to call / telephone','買い物する':'to shop',
'高い':'high / expensive','安い':'cheap / inexpensive','暑い':'hot (weather)','寒い':'cold (weather)','暖かい':'warm','涼しい':'cool (weather)','難しい':'difficult','易しい':'easy','面白い':'interesting / funny','忙しい':'busy','楽しい':'fun / enjoyable','近い':'near / close','遠い':'far','早い':'early / fast','遅い':'late / slow','長い':'long','短い':'short','白い':'white','黒い':'black','赤い':'red','青い':'blue','好き':'like / liked','嫌い':'dislike / disliked','元気':'healthy / energetic / well','静か':'quiet','にぎやか':'lively / bustling','きれい':'beautiful / clean','便利':'convenient','不便':'inconvenient',
'春':'spring','夏':'summer','秋':'autumn / fall','冬':'winter','天気':'weather','雨':'rain','雪':'snow','風':'wind','空':'sky','海':'sea / ocean','町':'town','国':'country','家':'house / home','部屋':'room','机':'desk','椅子':'chair','窓':'window','ドア':'door','本':'book','新聞':'newspaper','手紙':'letter','写真':'photo / photograph','時計':'clock / watch','電話':'telephone / phone','車':'car','電車':'train','自転車':'bicycle','飛行機':'airplane',
'食べ物':'food','飲み物':'drink / beverage','肉':'meat','魚':'fish','野菜':'vegetables','果物':'fruit','パン':'bread','牛乳':'milk','卵':'egg','お金':'money','円':'yen','時間':'time / hour','分':'minute','週':'week','月曜日':'Monday','火曜日':'Tuesday','水曜日':'Wednesday','木曜日':'Thursday','金曜日':'Friday','土曜日':'Saturday','日曜日':'Sunday',
'毎朝':'every morning','七時':'seven o’clock','映画':'movie / film','猫':'cat','何時':'what time','一緒に':'together','昼ご飯':'lunch'
}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function remoteCards(){return remoteCourse.map(x=>({id:'r-'+x.id,level:x.level||'N5',front:x.word||x.reading,reading:x.reading,meaning:x.en,deck:'Vokabeln',example:''}))}
function personalCards(){return personal.map(x=>({id:'p-'+x.id,level:x.level||'N5',front:x.word||x.reading,reading:x.reading,meaning:x.en,deck:'Vokabeln',example:x.example||''}))}
function english(c){if(c.deck==='Grammatik')return grammarEN[c.front]||((c.community&&c.meaning)||'');if(c.deck==='Hiragana'||c.deck==='Katakana')return c.meaning;if(offlineEN[c.front])return offlineEN[c.front];if(/^(oj-|gx-|[rp]-|fv-)/.test(c.id||'')&&c.meaning&&/^[\x00-\x7F–—’‘“”…éōūīā\s;,:.!?()\/-]+$/.test(c.meaning))return c.meaning;return ''}
function allCards(){return [...baseCards,...FOUNDATION_WORDS,...FOUNDATION_GRAMMAR,...externalCourse,...externalGrammar,...remoteCards(),...personalCards()]}
function key(c,dir){return `${c.id}::${dir}`}
const EMPTY_PROGRESS=Object.freeze({reps:0,due:0,interval:0,ease:2.35,again:0,hard:0,good:0,easy:0});
function getP(c,dir){return progress[key(c,dir)]||EMPTY_PROGRESS}
function pf(c,dir){const k=key(c,dir);if(!progress[k])progress[k]={reps:0,due:0,interval:0,ease:2.35,again:0,hard:0,good:0,easy:0};return progress[k]}
let saveTimer=0;
function flushSave(){
  saveTimer=0;
  try{
    localStorage.setItem('rn_final_settings',JSON.stringify(settings));
    localStorage.setItem('rn_final_progress',JSON.stringify(progress));
    localStorage.setItem('rn_final_stats',JSON.stringify(stats));
    localStorage.setItem('rn_final_personal',JSON.stringify(personal));
  }catch(e){console.warn('Save failed',e)}
}
function save(){
  if(saveTimer)return;
  const run=()=>flushSave();
  if('requestIdleCallback' in window) saveTimer=requestIdleCallback(run,{timeout:350});
  else saveTimer=setTimeout(run,80);
}
window.addEventListener('pagehide',flushSave);
window.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushSave()});
function eligible(){return allCards().filter(c=>['N5','N4','N3','N2','N1','Kana'].includes(c.level)&&((c.deck==='Hiragana'||c.deck==='Katakana')||english(c)||c.deck==='Grammatik'))}
function score(p){return !p||!p.reps?0:Math.max(0,(p.good||0)+(p.easy||0)-(p.again||0)*.5-(p.hard||0)*.15)}
function receptiveKnown(c){const p=getP(c,'jp-en');return p.reps>=2&&p.interval>=.45&&score(p)>=1}
function receptiveStrong(c){const p=getP(c,'jp-en');return p.reps>=3&&p.interval>=1&&score(p)>=1.8}
function productiveReady(c){return receptiveStrong(c)}
function productiveKnown(c){const p=getP(c,'en-jp');return p.reps>=2&&p.interval>=.35&&score(p)>=.8}
function lessonSeen(c){return !!progress[`lesson::${c.id}`]?.reps}
function grammarKnown(c){return lessonSeen(c)&&getP(c,'jp-en').reps>=2&&score(getP(c,'jp-en'))>=.8}
function cardsAt(level,deck){return eligible().filter(c=>c.level===level&&(!deck||c.deck===deck))}
function ratioKnown(level,deck,fn=receptiveKnown){const a=cardsAt(level,deck);return a.length?a.filter(fn).length/a.length:0}
function levelSentenceMastery(level){const pool=sentencePool(level);return pool.filter(s=>receptiveKnown(sentenceCard(s))).length}
function levelReadyToAdvance(level){
  // Never advance on a partial dataset. The complete level must have been loaded first.
  if(!externalLoaded.has(level))return false;
  const vocab=cardsAt(level,'Vokabeln').filter(c=>english(c)), grammar=cardsAt(level,'Grammatik');
  if(!vocab.length||!grammar.length)return false;
  const vocabKnown=vocab.filter(receptiveKnown).length, grammarKnownCount=grammar.filter(grammarKnown).length;
  const vocabTarget=Math.max(35,Math.ceil(vocab.length*.70));
  const grammarTarget=Math.max(8,Math.ceil(grammar.length*.65));
  const sentenceTarget=Math.min(12,Math.max(6,Math.ceil(sentencePool(level).length*.03)));
  return vocabKnown>=Math.min(vocab.length,vocabTarget)&&grammarKnownCount>=Math.min(grammar.length,grammarTarget)&&levelSentenceMastery(level)>=sentenceTarget;
}
function activeLevel(){for(const level of ['N5','N4','N3','N2','N1'])if(!levelReadyToAdvance(level))return level;return'N1'}
function findWord(word){return eligible().find(c=>c.deck==='Vokabeln'&&c.front===word)}
function findGrammar(pattern){return eligible().find(c=>c.deck==='Grammatik'&&c.front===pattern)}
// Sentence Engine v3: source sentences are selected from the curriculum, not generated.
// A sentence is introduced only after its target word is known and its supporting vocabulary/grammar is familiar.
const SENTENCE_IGNORE=new Set(['私','僕','あなた','これ','それ','あれ','この','その','あの']);
function stableHash(text=''){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(36)}
function sentenceCard(s){return{id:s.id,level:s.level,front:s.jp,reading:s.reading||'',meaning:s.en,deck:'Sentence',targetId:s.targetId||'',targetWord:s.targetWord||'',dynamic:!!s.dynamic}}
function knownWordsInText(text,level){return cardsAt(level,'Vokabeln').filter(c=>c.front&&((c.front.length>1)||/[一-龯]/.test(c.front))&&text.includes(c.front))}
function detectedGrammar(text,level){return cardsAt(level,'Grammatik').filter(c=>{const f=(c.front||'').replace(/[A-Z～ +／\/（）()]/g,'').trim();if(!f||f.length<1)return false;const pieces=f.split(/[・|]/).filter(x=>x.length>=1);return pieces.some(x=>text.includes(x))})}
function dynamicSentenceFromWord(c){
  if(!c.example||!c.exampleEn||!c.front||!exampleContainsTarget(c.example,c.front))return null;
  const jp=String(c.example).trim(),en=String(c.exampleEn).trim();
  if(jp.length<4||jp.length>72||en.length<3)return null;
  return{id:'ex-'+stableHash(c.id+'|'+jp),level:c.level,jp,reading:'',en,targetId:c.id,targetWord:c.front,dynamic:true};
}
function exampleContainsTarget(jp,word){
  if(!jp||!word)return false;
  const variants=String(word).split(/[\/・]/).map(x=>x.trim()).filter(Boolean);
  return variants.some(v=>String(jp).includes(v));
}
function chooseCourseExample(x){
  const word=x.word||x.reading||'';
  const candidates=(x.examples||[]).filter(e=>e&&e.ja&&e.en&&exampleContainsTarget(e.ja,word));
  if(!candidates.length)return{};
  // Prefer compact, neutral examples. Shorter contexts reduce accidental unknown vocabulary for first exposure.
  const scored=candidates.map(e=>{const ja=String(e.ja).trim(),en=String(e.en).trim();let penalty=ja.length+en.length*.18;if(/[！!]{1,}/.test(ja))penalty+=12;if(/[「」『』]/.test(ja))penalty+=5;return{...e,_score:penalty}}).sort((a,b)=>a._score-b._score);
  return scored[0];
}
function sentencePool(level=activeLevel()){
  const curated=sentencePack.filter(s=>s.level===level);
  const seen=new Set(curated.map(s=>s.jp));
  const dynamic=[];
  const source=cardsAt(level,'Vokabeln').sort((a,b)=>vocabPriority(a)-vocabPriority(b));
  for(const c of source){
    const s=dynamicSentenceFromWord(c);if(!s||seen.has(s.jp))continue;seen.add(s.jp);dynamic.push(s);
    if(dynamic.length>=60)break;
  }
  return [...curated,...dynamic];
}
function sentenceRequirements(s){
  if(SENTENCE_RULES[s.id])return SENTENCE_RULES[s.id];
  const target=allCards().find(c=>c.id===s.targetId)||findWord(s.targetWord);
  const words=knownWordsInText(s.jp,s.level).filter(c=>!target||c.id!==target.id).filter(c=>!SENTENCE_IGNORE.has(c.front));
  const grams=detectedGrammar(s.jp,s.level);
  return{target,words,grams};
}
function sentenceUnlocked(s){
  const explicit=SENTENCE_RULES[s.id];
  if(explicit){
    const words=explicit.v.map(findWord),grams=explicit.g.map(findGrammar);
    // A curated prerequisite is mandatory: unresolved prerequisites lock the sentence instead of being silently ignored.
    if(words.some(x=>!x)||grams.some(x=>!x))return false;
    const vocabOK=words.length?words.every(receptiveKnown):cardsAt(s.level,'Vokabeln').filter(receptiveKnown).length>=12;
    const grammarOK=grams.length?grams.every(grammarKnown):cardsAt(s.level,'Grammatik').filter(grammarKnown).length>=2;
    return vocabOK&&grammarOK
  }
  const r=sentenceRequirements(s);if(!r.target||!receptiveKnown(r.target))return false;
  // Context may recycle known material, but never introduce a second unlearned curriculum word.
  if(r.words.some(w=>!receptiveKnown(w)))return false;
  // If a recognisable grammar point occurs, it must already have been taught.
  if(r.grams.length&&r.grams.some(g=>!grammarKnown(g)))return false;
  if(cardsAt(s.level,'Grammatik').filter(grammarKnown).length<2)return false;
  return true;
}

function sentenceProductionUnlocked(s){if(!sentenceUnlocked(s))return false;const c={id:s.id,level:s.level,front:s.jp,reading:s.reading,meaning:s.en,deck:'Sentence'};if(!receptiveStrong(c))return false;const explicit=SENTENCE_RULES[s.id];let words=explicit?explicit.v.map(findWord).filter(Boolean):(()=>{const r=sentenceRequirements(s);return [r.target,...r.words].filter(Boolean)})();if(explicit&&!words.length)words=knownWordsInText(s.jp,s.level);return words.length>0&&words.every(productiveKnown)}
function sentenceProductionKind(c){return getP(c,'en-jp').reps<2?'BUILD':'SENTENCE PRODUCTION'}
function directionUnlocked(c,dir){if(dir==='jp-en')return true;if(c.deck==='Vokabeln'||c.deck==='Kanji')return productiveReady(c);return false}
function directionsFor(c){if(c.deck==='Hiragana'||c.deck==='Katakana'||c.deck==='Grammatik')return ['jp-en'];return ['jp-en','en-jp'].filter(d=>directionUnlocked(c,d))}
function task(c,dir,p=getP(c,dir)){return{kind:c.deck==='Grammatik'?'GRAMMAR PRACTICE':c.deck==='Kanji'?'KANJI':c.deck==='Hiragana'||c.deck==='Katakana'?'KANA':'WORD',c,dir,p}}
function dueTasks(){const now=Date.now(),out=[];for(const c of eligible())for(const d of directionsFor(c)){const p=getP(c,d);if(p.reps&&p.due<=now)out.push(task(c,d,p))}for(const level of ['N5','N4','N3','N2','N1'])for(const s of sentencePool(level)){const c=sentenceCard(s);for(const d of ['jp-en','en-jp']){if(d==='jp-en'&&!sentenceUnlocked(s))continue;if(d==='en-jp'&&!sentenceProductionUnlocked(s))continue;const p=getP(c,d);if(p.reps&&p.due<=now)out.push({kind:d==='jp-en'?'SENTENCE READING':sentenceProductionKind(c),c,dir:d,p})}}return out.sort((a,b)=>a.p.due-b.p.due)}
function nextGrammarLessons(level,limit=1){const vocabKnown=cardsAt(level,'Vokabeln').filter(receptiveKnown).length;if(vocabKnown<8)return[];return cardsAt(level,'Grammatik').filter(c=>!lessonSeen(c)&&grammarReady(c)).sort((a,b)=>grammarOrder(a)-grammarOrder(b)).slice(0,limit).map(c=>({kind:'GRAMMAR LESSON',c,dir:'lesson',p:{reps:0,due:0,interval:0}}))}
function newTasks(limit=settings.newLimit){const level=activeLevel(),arr=[];
 const vocab=cardsAt(level,'Vokabeln').filter(c=>english(c)).sort((a,b)=>vocabPriority(a)-vocabPriority(b));
 for(const c of vocab){if(!getP(c,'jp-en').reps)arr.push(task(c,'jp-en'));else if(directionUnlocked(c,'en-jp')&&!getP(c,'en-jp').reps)arr.push(task(c,'en-jp'))}
 const grammar=cardsAt(level,'Grammatik').filter(c=>lessonSeen(c));for(const c of grammar)if(!getP(c,'jp-en').reps)arr.push(task(c,'jp-en'));
 const priority=t=>t.dir==='jp-en'&&t.kind==='WORD'?0:t.kind==='GRAMMAR PRACTICE'?1:t.dir==='en-jp'?3:2;
 arr.sort((a,b)=>priority(a)-priority(b)||vocabPriority(a.c)-vocabPriority(b.c));return arr.slice(0,limit)}
function sentencePriority(s){
  if(!s.dynamic)return 0;
  const target=allCards().find(c=>c.id===s.targetId);const p=target?getP(target,'jp-en'):EMPTY_PROGRESS;
  // Prefer recently learned targets over ancient mastered words, then source-course order.
  return 100+Math.min(500,p.interval||0)+(target?Math.max(0,vocabPriority(target))/10000:50);
}
function sentenceTasks(limit=3){
  const level=activeLevel(),out=[];
  for(const s of sentencePool(level).sort((a,b)=>sentencePriority(a)-sentencePriority(b))){
    const c=sentenceCard(s);
    if(sentenceUnlocked(s)&&!getP(c,'jp-en').reps)out.push({kind:'SENTENCE READING',c,dir:'jp-en',p:getP(c,'jp-en'),sentence:s});
    else if(sentenceProductionUnlocked(s)&&!getP(c,'en-jp').reps)out.push({kind:sentenceProductionKind(c),c,dir:'en-jp',p:getP(c,'en-jp'),sentence:s});
    if(out.length>=limit)break;
  }return out;
}
function sentenceChunks(c){
  if(SENTENCE_CHUNKS[c.id])return SENTENCE_CHUNKS[c.id];
  const text=c.front||'';
  try{
    if(Intl.Segmenter){const seg=[...new Intl.Segmenter('ja',{granularity:'word'}).segment(text)].map(x=>x.segment).filter(x=>x.trim()&&!/^[。、！？!?]$/.test(x));if(seg.length>=2&&seg.length<=14)return seg;}
  }catch(e){}
  // Safe fallback: keep particles/endings attached instead of splitting Japanese into arbitrary characters.
  return text.split(/(?<=[はがをにへでとも、。！？])|(?=[はがをにへでとも])/).map(x=>x.replace(/[。、！？]/g,'')).filter(Boolean);
}



async function cachedJSON(url){
  const cacheName='rn-nihongo-curriculum-v2';
  try{
    if('caches' in window){const cache=await caches.open(cacheName);const hit=await cache.match(url);if(hit)return await hit.json();const r=await fetch(url,{cache:'no-cache'});if(!r.ok)throw Error('HTTP '+r.status);await cache.put(url,r.clone());return await r.json()}
    const r=await fetch(url);if(!r.ok)throw Error('HTTP '+r.status);return await r.json();
  }catch(e){return null}
}
function stripHTML(s=''){const d=document.createElement('div');d.innerHTML=s;return d.textContent||''}
function grammarCardsFromCommunity(data,level){
  const sec=data?.[level.toLowerCase()]?.sections||[];const out=[];let order=0;
  for(const section of sec)for(const x of (section.cards||[])){
    const raw=String(x.example||'');const m=raw.match(/^(.*?)<span>(.*?)<\/span>/s);const jp=m?stripHTML(m[1]).trim():stripHTML(raw).trim();const en=m?stripHTML(m[2]).trim():'';
    out.push({id:`gx-${x.id||level+'-'+order}`,sourceId:x.id||'',deck:'Grammatik',level,front:x.jp||x.point,reading:'',romaji:'',meaning:x.meaning||x.point||'',example:jp,exampleEn:en,formation:x.jp||x.point||'',section:section.title||'Grammar',refs:Array.isArray(x.refs)?x.refs:[],courseOrder:order++,community:true});
  }return out
}
function grammarOrder(c){if(Number.isFinite(c.courseOrder))return c.courseOrder;return cardsAt(c.level,'Grammatik').indexOf(c)}
function grammarReady(c){
  if(lessonSeen(c)||grammarKnown(c))return true;
  const gs=cardsAt(c.level,'Grammatik').slice().sort((a,b)=>grammarOrder(a)-grammarOrder(b));const idx=gs.findIndex(x=>x.id===c.id);
  if(idx<=0)return true;
  const prior=gs.slice(Math.max(0,idx-4),idx);const learned=prior.filter(x=>lessonSeen(x)||grammarKnown(x)).length;
  const refCards=(c.refs||[]).map(r=>allCards().find(x=>x.deck==='Grammatik'&&x.sourceId===r)).filter(Boolean);
  const refsOK=!refCards.length||refCards.some(x=>lessonSeen(x)||grammarKnown(x));
  return learned>=Math.min(2,prior.length)&&refsOK;
}
async function loadLevelData(level){
  if(externalLoaded.has(level))return true;
  if(externalLoading.has(level))return externalLoading.get(level);
  const job=(async()=>{
    const lv=level.toLowerCase();
    const [vocab,grammar]=await Promise.all([
      cachedJSON(`https://raw.githubusercontent.com/evanclan/OpenJLPT/main/data/json/vocab/${lv}.json`),
      cachedJSON('https://raw.githubusercontent.com/qatoqat/jlpt-grammar/main/grammar-data.json')
    ]);
    if(!Array.isArray(vocab)||!vocab.length)return false;
    const existingFront=new Set(allCards().filter(c=>c.deck==='Vokabeln'&&english(c)).map(c=>String(c.front||'').trim()));
    const addedFront=new Set();
    externalCourse.push(...vocab.map((x,i)=>{const ex=chooseCourseExample(x);return{id:`oj-${level}-${i}`,deck:'Vokabeln',level,front:x.word||x.reading,reading:x.reading||'',romaji:'',meaning:(x.meanings||[]).slice(0,5).join('; '),example:ex.ja||'',exampleEn:ex.en||'',source:'OpenJLPT',courseOrder:i}}).filter(c=>{const f=String(c.front||'').trim();if(!f||!c.meaning||existingFront.has(f)||addedFront.has(f))return false;addedFront.add(f);return true;}));
    if(grammar){
      const gExisting=new Set(allCards().filter(c=>c.deck==='Grammatik').map(c=>c.front));
      externalGrammar.push(...grammarCardsFromCommunity(grammar,level).filter(c=>c.front&&c.meaning&&!gExisting.has(c.front)));
    }
    externalLoaded.add(level);return true;
  })().finally(()=>externalLoading.delete(level));
  externalLoading.set(level,job);return job;
}
async function ensureCurriculum(){
  const level=activeLevel();
  const ok=await loadLevelData(level);
  if(ok){
    // Rendering is deferred so curriculum parsing never blocks taps or lesson transitions.
    const update=()=>{try{if(activeScreen==='home')renderHome()}catch(e){}};
    if('requestIdleCallback' in window)requestIdleCallback(update,{timeout:900});else setTimeout(update,120);
  }
  return ok;
}
async function seedCourseVocabulary(){await ensureCurriculum()}
function vocabPriority(c){
  if((c.id||'').startsWith('fv-'))return -200000;
  // The audited local core is deliberately ordered by usefulness and must precede bulk JLPT imports.
  if((c.id||'').startsWith('v-'))return -100000+(Number((c.id||'').split('-').pop())||0);
  if((c.id||'').startsWith('oj-')){
    const exBonus=c.example&&c.exampleEn?-12000:0;
    const compact=Math.min(4000,String(c.front||'').length*120);
    return 10000+exBonus+compact+(Number.isFinite(c.courseOrder)?c.courseOrder:50000);
  }
  return 90000;
}
function romajiJP(text=''){const map={'あ':'a','い':'i','う':'u','え':'e','お':'o','か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko','さ':'sa','し':'shi','す':'su','せ':'se','そ':'so','た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to','な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no','は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho','ま':'ma','み':'mi','む':'mu','め':'me','も':'mo','や':'ya','ゆ':'yu','よ':'yo','ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro','わ':'wa','を':'o','ん':'n','が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go','ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo','だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do','ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo','ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po','ア':'a','イ':'i','ウ':'u','エ':'e','オ':'o','カ':'ka','キ':'ki','ク':'ku','ケ':'ke','コ':'ko','サ':'sa','シ':'shi','ス':'su','セ':'se','ソ':'so','タ':'ta','チ':'chi','ツ':'tsu','テ':'te','ト':'to','ナ':'na','ニ':'ni','ヌ':'nu','ネ':'ne','ノ':'no','ハ':'ha','ヒ':'hi','フ':'fu','ヘ':'he','ホ':'ho','マ':'ma','ミ':'mi','ム':'mu','メ':'me','モ':'mo','ヤ':'ya','ユ':'yu','ヨ':'yo','ラ':'ra','リ':'ri','ル':'ru','レ':'re','ロ':'ro','ワ':'wa','ヲ':'o','ン':'n','ガ':'ga','ギ':'gi','グ':'gu','ゲ':'ge','ゴ':'go','ザ':'za','ジ':'ji','ズ':'zu','ゼ':'ze','ゾ':'zo','ダ':'da','デ':'de','ド':'do','バ':'ba','ビ':'bi','ブ':'bu','ベ':'be','ボ':'bo','パ':'pa','ピ':'pi','プ':'pu','ペ':'pe','ポ':'po'};let out='',gem=false;for(let i=0;i<text.length;i++){let ch=text[i],n=text[i+1]||'';if(ch==='っ'||ch==='ッ'){gem=true;continue}let pair=ch+n,pm={'きゃ':'kya','きゅ':'kyu','きょ':'kyo','しゃ':'sha','しゅ':'shu','しょ':'sho','ちゃ':'cha','ちゅ':'chu','ちょ':'cho','にゃ':'nya','にゅ':'nyu','にょ':'nyo','ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo','みゃ':'mya','みゅ':'myu','みょ':'myo','りゃ':'rya','りゅ':'ryu','りょ':'ryo','ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo','じゃ':'ja','じゅ':'ju','じょ':'jo','びゃ':'bya','びゅ':'byu','びょ':'byo','ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo'}[pair];let r=pm||map[ch]||ch;if(pm)i++;if(gem&&/^[a-z]/.test(r)){r=r[0]+r;gem=false}out+=r}return out.replace(/。/g,'.').replace(/、/g,', ')}
function readingFor(c){const r=String(c.reading||'').trim();if(!r)return /^[ぁ-んァ-ヶー]+$/.test(String(c.front||''))?romajiJP(c.front):'';const parts=r.split('·').map(x=>x.trim()).filter(Boolean);const latin=parts.findLast?parts.findLast(x=>/[A-Za-zāīūēō]/.test(x)):parts.slice().reverse().find(x=>/[A-Za-zāīūēō]/.test(x));if(latin)return latin;return /[ぁ-んァ-ン]/.test(r)?romajiJP(r):r}
function speakJapanese(text){if(!('speechSynthesis'in window))return toast('Japanese audio is not available on this device');speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='ja-JP';u.rate=.82;const vs=speechSynthesis.getVoices();u.voice=vs.find(v=>/^ja/i.test(v.lang))||null;speechSynthesis.speak(u)}
function shuffled(a){return [...a].sort(()=>Math.random()-.5)}
function choicesFor(c,correct){
  const norm=x=>String(x||'').trim().toLowerCase().replace(/\s+/g,' ');
  const pool=cardsAt(c.level,c.deck).filter(x=>x.id!==c.id).map(english).filter(Boolean).filter(x=>norm(x)!==norm(correct));
  const distractors=[];const seen=new Set([norm(correct)]);
  for(const x of shuffled(pool)){const k=norm(x);if(!k||seen.has(k))continue;seen.add(k);distractors.push(x);if(distractors.length===3)break}
  return shuffled([correct,...distractors]);
}
function sentenceMeaningChoices(c){const pool=sentencePool(c.level).filter(s=>s.jp!==c.front&&s.en).map(s=>s.en);return shuffled([...new Set([c.meaning,...shuffled(pool).slice(0,6)])]).slice(0,4)}
function grammarPatternChoices(c){const pool=cardsAt(c.level,'Grammatik').filter(x=>x.id!==c.id&&(lessonSeen(x)||grammarKnown(x)||grammarReady(x))).map(x=>x.front);return shuffled([...new Set([c.front,...shuffled(pool).slice(0,6)])]).slice(0,4)}
function addAudio(text){const b=document.createElement('button');b.className='audioBtn';b.textContent='🔊 Listen';b.onclick=()=>speakJapanese(text);$('hint').after(b)}
function clearExtras(){document.querySelectorAll('.audioBtn,.choiceGrid,.buildRow,.buildAnswer,.buildCheck,.practiceNote').forEach(x=>x.remove())}
function completePractice(){const n=document.createElement('div');n.className='practiceNote';n.textContent='Correct';$('hint').after(n);setTimeout(()=>{qi++;showTask()},500)}
function addChoiceGrid(options,correct,onCorrect){const box=document.createElement('div');box.className='choiceGrid';options.forEach(x=>{const b=document.createElement('button');b.className='choiceBtn';b.textContent=x;b.onclick=()=>{if(x===correct){box.querySelectorAll('button').forEach(q=>q.disabled=true);b.textContent='✓ '+x;setTimeout(onCorrect,180)}else{b.textContent='Try again';b.disabled=true}};box.appendChild(b)});$('hint').after(box);return box}
function renderGrammarHub(){const level=activeLevel(),gs=cardsAt(level,'Grammatik').slice().sort((a,b)=>grammarOrder(a)-grammarOrder(b));const learned=gs.filter(grammarKnown).length,seen=gs.filter(lessonSeen).length;$('grammarSummary').innerHTML=`<strong>${level} Grammar · ${learned}/${gs.length} learned</strong><p class="subtle">Patterns unlock in course order. Tap an available pattern to learn or practise it.</p>`;$('grammarList').innerHTML=gs.map(c=>{const ready=grammarReady(c),state=grammarKnown(c)?'Learned':lessonSeen(c)?'Practicing':ready?'Lesson':'Locked';return `<button type="button" class="grammarItem ${ready?'':'locked'}" data-grammar-id="${esc(c.id)}" ${ready?'':'disabled'}><div><b>${esc(c.front)}</b><small>${esc(c.section?c.section+' · ':'')}${esc(c.meaning||grammarEN[c.front]||'Grammar pattern')}</small></div><span class="statusPill ${grammarKnown(c)?'done':''}">${state}</span></button>`}).join('');$('grammarList').querySelectorAll('[data-grammar-id]:not([disabled])').forEach(b=>b.onclick=()=>{const c=allCards().find(x=>x.id===b.dataset.grammarId);if(!c)return;const t=!lessonSeen(c)?{kind:'GRAMMAR LESSON',c,dir:'lesson',p:{reps:0,due:0,interval:0}}:exerciseVariant(task(c,'jp-en'));queue=[t];qi=0;screen('learn');showTask()})}
function startFocused(kind){const level=activeLevel();if(kind==='kana'){queue=eligible().filter(c=>['Hiragana','Katakana'].includes(c.deck)).slice(0,12).map(c=>task(c,'jp-en'))}else{const due=dueTasks().filter(t=>t.kind==='WORD'),fresh=newTasks(20).filter(t=>t.kind==='WORD');queue=[...due,...fresh].slice(0,15)}qi=0;screen('learn');showTask()}
let queue=[],qi=0,current=null;
function exerciseVariant(t){
  if(t.kind==='WORD'&&t.dir==='jp-en'&&t.p?.reps){const m=t.p.reps%3;return {...t,kind:m===1?'QUICK CHOICE':m===2?'WORD LISTEN':'WORD'};}
  if(t.kind==='GRAMMAR PRACTICE')return {...t,kind:t.p?.reps%2?'GRAMMAR IDENTIFY':'GRAMMAR MEANING'};
  return t;
}
function buildSession(){
  const due=dueTasks().map(exerciseVariant),level=activeLevel();
  // Reviews have priority. New material automatically slows down when the review load rises.
  // This prevents a learner who is struggling from accumulating an ever-growing backlog.
  const goal=Math.max(10,settings.goal),reviewCap=Math.min(due.length,goal);
  const reviewLoad=due.length/goal;
  const newBudget=reviewLoad>=1?0:reviewLoad>=.65?Math.min(2,settings.newLimit):Math.min(settings.newLimit,Math.max(0,goal-reviewCap));
  const lessonBudget=reviewLoad>=.8?0:1;
  const sentenceBudget=reviewLoad>=1?0:Math.min(3,Math.max(0,goal-reviewCap-newBudget-lessonBudget));
  const fresh=newTasks(newBudget),lessons=nextGrammarLessons(level,lessonBudget),sentences=sentenceTasks(sentenceBudget);
  let base=[...due.slice(0,reviewCap),...fresh,...lessons,...sentences];
  queue=[];
  for(const t0 of base){
    const t=exerciseVariant(t0);queue.push(t);
    // One low-stakes retrieval immediately after a genuinely new item. It does not reschedule the card.
    if(t.kind==='WORD'&&t.dir==='jp-en'&&!t.p.reps){queue.push({...t,kind:Math.random()<.5?'QUICK CHOICE':'WORD LISTEN',practiceOnly:true});}
    if(t.kind==='GRAMMAR LESSON'){queue.push({kind:'GRAMMAR IDENTIFY',c:t.c,dir:'jp-en',p:getP(t.c,'jp-en'),practiceOnly:true});}
    if(t.kind==='SENTENCE READING'){queue.push({...t,kind:'LISTEN',practiceOnly:true});}
  }
  const seen=new Set();
  queue=queue.filter(t=>{const k=(t.practiceOnly?'practice:':'srs:')+t.kind+'|'+t.c.id+'|'+t.dir;if(seen.has(k))return false;seen.add(k);return true}).slice(0,Math.max(10,settings.goal));
  if(!queue.length)queue=[...newTasks(6),...nextGrammarLessons(level,1)];qi=0;
}
function showTask(){
 current=queue[qi];if(!current){finishSession();return}clearExtras();$('answer').classList.add('hidden');$('ratings').classList.add('hidden');$('revealBtn').classList.remove('hidden');
 const {c,dir,kind}=current,en=kind.startsWith('SENTENCE')||['LISTEN','BUILD'].includes(kind)?c.meaning:english(c),lesson=kind==='GRAMMAR LESSON',sentence=kind.startsWith('SENTENCE')||['LISTEN','BUILD'].includes(kind);
 const labels={
  'GRAMMAR LESSON':'GRAMMAR LESSON · NEW','GRAMMAR PRACTICE':'GRAMMAR · RECALL','GRAMMAR IDENTIFY':'GRAMMAR · APPLY','GRAMMAR MEANING':'GRAMMAR · MEANING',
  'QUICK CHOICE':'VOCABULARY · CHOICE','WORD LISTEN':'VOCABULARY · LISTEN','WORD':'VOCABULARY · RECALL','KANA':'KANA · RECALL',
  'SENTENCE READING':'SENTENCE · READING','LISTEN':'SENTENCE · LISTEN','BUILD':'SENTENCE · BUILD','SENTENCE PRODUCTION':'SENTENCE · PRODUCTION'
 };
 const prompts={
  'GRAMMAR LESSON':'Learn the pattern before you use it.','GRAMMAR IDENTIFY':'Which grammar pattern is doing the work here?','GRAMMAR MEANING':'Choose the meaning of this grammar pattern.',
  'QUICK CHOICE':'Choose the English meaning.','WORD LISTEN':'Listen and choose the meaning.','SENTENCE READING':'Read and understand the whole sentence.','LISTEN':'Listen without reading. What does the sentence mean?',
  'BUILD':'Build the Japanese sentence from the English meaning.','SENTENCE PRODUCTION':'Produce the Japanese sentence from English.'
 };
 $('taskType').textContent=labels[kind]||`${kind} · ${dir==='jp-en'?'JAPANESE → ENGLISH':'ENGLISH → JAPANESE'}`;
 $('taskPrompt').textContent=prompts[kind]||(dir==='jp-en'?'Give the English meaning.':'Recall the Japanese word.');$('counter').textContent=`${qi+1}/${queue.length}`;
 const li=lesson||kind.startsWith('GRAMMAR')?lessonInfo(c):null;
 $('front').textContent=kind==='LISTEN'||kind==='WORD LISTEN'?'🔊':kind==='BUILD'?en:kind==='GRAMMAR IDENTIFY'?(li?.example||c.front):lesson?c.front:(dir==='jp-en'?c.front:en);
 $('front').classList.toggle('sentence',sentence||kind==='GRAMMAR IDENTIFY');
 $('reading').textContent=!lesson&&dir==='jp-en'&&settings.showRomaji&&!['LISTEN','WORD LISTEN','BUILD','GRAMMAR IDENTIFY'].includes(kind)?(readingFor(c)||''):'';
 $('hint').textContent=lesson?'Understand the idea first. Practice comes immediately after.':kind==='LISTEN'||kind==='WORD LISTEN'?'Replay as often as you need.':kind==='BUILD'?'Tap the chunks in Japanese word order.':kind==='GRAMMAR IDENTIFY'?'Use the sentence, not just the English label.':dir==='en-jp'?'Active recall comes after recognition is stable.':'Think first, then answer.';
 $('meaning').textContent=lesson?(grammarEN[c.front]||c.meaning||'Grammar pattern'):(dir==='jp-en'?en:c.front);
 if(lesson){$('example').textContent=[li.explain,li.formation?'FORM: '+li.formation:''].filter(Boolean).join('  ·  ');$('exampleEn').textContent=[li.example,settings.showRomaji&&li.example?romajiJP(li.example):'',li.translation].filter(Boolean).join('  ·  ')}
 else if(kind==='GRAMMAR IDENTIFY'||kind==='GRAMMAR MEANING'){$('example').textContent=li?.explain||'';$('exampleEn').textContent=[li?.example,li?.translation].filter(Boolean).join('  ·  ')}
 else if(sentence){$('example').textContent=dir==='en-jp'&&settings.showRomaji?readingFor(c):'';$('exampleEn').textContent=dir==='jp-en'?c.meaning:''}
 else if(c.exampleEn){$('example').textContent=c.example||'';$('exampleEn').textContent=[settings.showRomaji&&c.example?romajiJP(c.example):'',c.exampleEn].filter(Boolean).join('  ·  ')}
 else{$('example').textContent=dir==='en-jp'&&settings.showRomaji?readingFor(c):'';$('exampleEn').textContent=''}
 const input=$('taskInput');input.value='';input.classList.toggle('hidden',dir!=='en-jp'||['QUICK CHOICE','LISTEN','WORD LISTEN','BUILD','GRAMMAR IDENTIFY','GRAMMAR MEANING'].includes(kind));input.placeholder=kind==='SENTENCE PRODUCTION'?'Type the Japanese sentence (optional)':'Type Japanese (optional)';
 $('revealBtn').textContent=lesson?'Open lesson':'Show answer';
 const correctAction=()=>current.practiceOnly?completePractice():reveal();
 if(kind==='LISTEN'){addAudio(c.front);speakJapanese(c.front);addChoiceGrid(sentenceMeaningChoices(c),c.meaning,correctAction);$('revealBtn').classList.add('hidden')}
 else if(kind==='WORD LISTEN'){addAudio(c.front);speakJapanese(c.front);addChoiceGrid(choicesFor(c,english(c)),english(c),correctAction);$('revealBtn').classList.add('hidden')}
 else if(dir==='jp-en'&&/[ぁ-んァ-ン一-龯]/.test(c.front)&&!lesson&&!['GRAMMAR IDENTIFY','GRAMMAR MEANING'].includes(kind))addAudio(c.front);
 if(kind==='QUICK CHOICE'){addChoiceGrid(choicesFor(c,en),en,correctAction);$('revealBtn').classList.add('hidden')}
 if(kind==='GRAMMAR IDENTIFY'){addChoiceGrid(grammarPatternChoices(c),c.front,correctAction);$('revealBtn').classList.add('hidden')}
 if(kind==='GRAMMAR MEANING'){const options=choicesFor(c,english(c));addChoiceGrid(options,english(c),correctAction);$('revealBtn').classList.add('hidden')}
 if(kind==='BUILD'){
   const target=sentenceChunks(c),row=document.createElement('div');row.className='buildRow';const built=document.createElement('div');built.className='buildAnswer';built.textContent='Tap words to build the sentence';const check=document.createElement('button');check.className='smallBtn buildCheck';check.textContent='Check sentence';let chosen=[];
   shuffled(target).forEach(x=>{const b=document.createElement('button');b.className='buildChip';b.textContent=x;b.onclick=()=>{if(b.disabled)return;chosen.push(x);b.disabled=true;b.classList.add('picked');built.textContent=chosen.join('')}});built.onclick=()=>{chosen=[];row.querySelectorAll('.buildChip').forEach(b=>{b.disabled=false;b.classList.remove('picked')});built.textContent='Tap words to build the sentence'};
   check.onclick=()=>{if(chosen.join('')===target.join('')){built.textContent='✓ '+chosen.join('');check.textContent='Correct';check.disabled=true;setTimeout(correctAction,220)}else{built.textContent='Not quite — tap here to clear and try again.'}};$('hint').after(check);$('hint').after(row);$('hint').after(built);$('revealBtn').classList.add('hidden')
 }
}
function reveal(){$('answer').classList.remove('hidden');if(!current?.practiceOnly)$('ratings').classList.remove('hidden');$('revealBtn').classList.add('hidden');if(current&&current.dir==='en-jp'&&/[ぁ-んァ-ン一-龯]/.test(current.c.front)&&!document.querySelector('.audioBtn'))addAudio(current.c.front);updateTimes()}
function nextInterval(p,g,dir){const old=p.interval||0,active=dir==='en-jp';if(g==='again')return active?.012:.02;if(g==='hard'){if(old<1)return .5;if(old<7)return Math.max(2,old*1.8);return Math.min(180,old*1.45)}if(g==='good'){if(old<.5)return 1;if(old<2)return 3;if(old<7)return 10;if(old<21)return 30;if(old<60)return 90;if(old<180)return 240;return Math.min(540,old*1.8)}if(old<1)return 3;if(old<7)return 14;if(old<30)return 60;if(old<90)return 180;if(old<240)return 365;return Math.min(900,old*2)}
function grade(g){if(current.kind==='GRAMMAR LESSON'){const k=`lesson::${current.c.id}`;const p=progress[k]||{reps:0};p.reps++;p.last=Date.now();p.understanding=g;progress[k]=p;stats.reviews++;touchDay();save();qi++;showTask();return}const p=pf(current.c,current.dir);p.reps++;p[g]=(p[g]||0)+1;p.interval=nextInterval(p,g,current.dir);if(g==='again')p.ease=Math.max(1.3,p.ease-.18);else if(g==='hard')p.ease=Math.max(1.3,p.ease-.05);else if(g==='easy')p.ease=Math.min(3,p.ease+.08);p.due=Date.now()+p.interval*DAY;stats.reviews++;touchDay();save();qi++;showTask()}
function touchDay(){const d=new Date().toISOString().slice(0,10);stats.days[d]=(stats.days[d]||0)+1;if(stats.lastDay!==d){const y=new Date(Date.now()-DAY).toISOString().slice(0,10);stats.streak=stats.lastDay===y?stats.streak+1:1;stats.lastDay=d}}
function fmt(days){if(days<.03)return `${Math.max(1,Math.round(days*1440))}m`;if(days<1)return `${Math.round(days*24)}h`;return `${Math.round(days)}d`}
function updateTimes(){if(current.kind==='GRAMMAR LESSON'){$('againTime').textContent='review';$('hardTime').textContent='soon';$('goodTime').textContent='learned';$('easyTime').textContent='clear';return}const p=pf(current.c,current.dir);$('againTime').textContent=fmt(nextInterval(p,'again',current.dir));$('hardTime').textContent=fmt(nextInterval(p,'hard',current.dir));$('goodTime').textContent=fmt(nextInterval(p,'good',current.dir));$('easyTime').textContent=fmt(nextInterval(p,'easy',current.dir))}
function renderHome(){const due=dueTasks().length,n=newTasks(settings.newLimit).length,level=activeLevel(),day=new Date().toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'});$('todayLabel').textContent=day.toUpperCase();$('dueText').textContent=`${due} review${due===1?'':'s'}`;$('newText').textContent=`${n} new`;$('streakText').textContent=`${stats.streak} day streak`;$('goalText').textContent=`${settings.goal} cards goal`;$('todayCards').innerHTML=`<div class="mini"><strong>${due}</strong><span>due now</span></div><div class="mini"><strong>${n}</strong><span>new ready</span></div><div class="mini"><strong>${stats.reviews}</strong><span>total reviews</span></div>`;const vr=Math.round(ratioKnown(level,'Vokabeln')*100),gr=Math.round(ratioKnown(level,'Grammatik',grammarKnown)*100);const sentenceReady=sentencePool(level).filter(sentenceUnlocked).length;$('heroTitle').textContent=due?'Reviews first.':`Next: ${level} foundations.`;$('heroText').textContent=vr<25?'Build vocabulary first. Grammar and sentences unlock when you are ready.':gr<20?'Vocabulary is growing. Grammar lessons are now entering your sessions.':'Your course now rotates recognition, listening, grammar application, sentence reading, building and production automatically.';if($('missionTitle')){$('missionTitle').textContent=vr<25?'Build a useful vocabulary base.':gr<20?'Learn one pattern, then use it.':'Understand Japanese in context.';$('missionText').textContent=sentenceReady?'Today mixes retrieval, listening, grammar application and '+sentenceReady+' unlocked sentence'+(sentenceReady===1?'':'s')+'.':'New sentences stay locked until their vocabulary and grammar are ready.';} $('courseCard').innerHTML=`<strong>${level} · Understand first, produce later</strong><p>Recognition → listening → grammar application → sentence reading → building → active production. Strong items fade out of rotation.</p><div class="bar"><i style="width:${Math.min(100,Math.round(vr*.65+gr*.35))}%"></i></div><p>${vr}% vocabulary foundation · ${gr}% grammar foundation · ${sentenceReady} sentence${sentenceReady===1?'':'s'} unlocked</p>`}
const screenScroll={home:0,vocabulary:0,grammar:0,progress:0,settings:0};let activeScreen='home';
function screen(id){if(id!== 'learn' && activeScreen!=='learn')screenScroll[activeScreen]=window.scrollY||0;document.querySelectorAll('.screen').forEach(x=>x.classList.toggle('active',x.id===id));document.querySelectorAll('.nav [data-screen]').forEach(x=>x.classList.toggle('active',x.dataset.screen===id));activeScreen=id;if(id==='progress')renderProgress();if(id==='grammar')renderGrammarHub();if(id!=='learn')requestAnimationFrame(()=>window.scrollTo(0,screenScroll[id]||0))}
function curriculumAudit(level){
  const vocab=cardsAt(level,'Vokabeln').filter(c=>english(c));
  const grammar=cardsAt(level,'Grammatik');
  const fronts=new Set(),dupes=[];for(const c of vocab){if(fronts.has(c.front))dupes.push(c.front);fronts.add(c.front)}
  const badExamples=vocab.filter(c=>c.example&&(!c.exampleEn||!exampleContainsTarget(c.example,c.front)));
  const grammarWithoutExample=grammar.filter(c=>{const x=lessonInfo(c);return !x.example||!x.translation});
  const nonEnglishGrammar=grammar.filter(c=>!grammarEN[c.front]&&!c.community);
  const explicitSentences=sentencePack.filter(s=>s.level===level);
  const incompleteSentenceRules=explicitSentences.filter(s=>{const r=SENTENCE_RULES[s.id],ch=SENTENCE_CHUNKS[s.id];return !r||!r.v?.length||!Array.isArray(r.g)||!ch||ch.length<2});
  return{vocab:vocab.length,grammar:grammar.length,duplicates:dupes.length,badExamples:badExamples.length,grammarWithoutExample:grammarWithoutExample.length,nonEnglishGrammar:nonEnglishGrammar.length,incompleteSentenceRules:incompleteSentenceRules.length,sentences:sentencePool(level).length};
}
function fullCurriculumAudit(){
  const levels=['N5','N4','N3','N2','N1'];
  const audits=levels.map(curriculumAudit);
  const explicit=sentencePack;
  const missingWords=[];const missingGrammar=[];
  for(const sent of explicit){const r=SENTENCE_RULES[sent.id];if(!r)continue;for(const w of r.v||[])if(!findWord(w))missingWords.push(sent.id+':'+w);for(const g of r.g||[])if(!allCards().some(c=>c.deck==='Grammatik'&&c.front===g))missingGrammar.push(sent.id+':'+g)}
  return{levels:audits,missingWords,missingGrammar,issues:audits.reduce((n,a)=>n+a.duplicates+a.badExamples+a.grammarWithoutExample+a.nonEnglishGrammar+a.incompleteSentenceRules,0)+missingWords.length+missingGrammar.length};
}
function renderProgress(){const ps=Object.entries(progress),learned=ps.filter(([,p])=>p.reps).length,mastered=ps.filter(([,p])=>p.interval>=180).length;const loaded=[...externalLoaded].reduce((n,l)=>n+JLPT_COUNTS[l],0),total=Object.values(JLPT_COUNTS).reduce((a,b)=>a+b,0),level=activeLevel(),ready=levelReadyToAdvance(level),audit=curriculumAudit(level),fullAudit=fullCurriculumAudit();$('progressGrid').innerHTML=`<div class="panel"><strong>${stats.reviews}</strong><span class="subtle">reviews</span></div><div class="panel"><strong>${learned}</strong><span class="subtle">directions learned</span></div><div class="panel"><strong>${mastered}</strong><span class="subtle">mastered · 180d+</span></div><div class="panel"><strong>${loaded.toLocaleString()} / ${total.toLocaleString()}</strong><span class="subtle">JLPT words cached this session</span></div><div class="panel"><strong>${ready?'Ready':'In progress'}</strong><span class="subtle">${level} curriculum gate</span></div><div class="panel"><strong>${audit.badExamples+audit.duplicates+audit.grammarWithoutExample+audit.nonEnglishGrammar+audit.incompleteSentenceRules===0?'Passed':'Checking'}</strong><span class="subtle">${level} content audit · ${audit.vocab} words · ${audit.grammar} grammar · ${audit.sentences} sentences</span></div><div class="panel"><strong>${fullAudit.issues===0?'Passed':'Checking'}</strong><span class="subtle">N5→N1 dependency audit · ${fullAudit.missingWords.length} missing words · ${fullAudit.missingGrammar.length} missing grammar</span></div>`;let jp=0,en=0,jpc=0,enc=0;for(const[k,p]of ps){if(k.endsWith('::jp-en')){jp+=(p.again||0)+(p.hard||0);jpc+=p.reps||0}else if(k.endsWith('::en-jp')){en+=(p.again||0)+(p.hard||0);enc+=p.reps||0}}$('directionStats').innerHTML=`<div class="directionRow"><span>Japanese → English</span><strong>${jpc?Math.round(100*jp/jpc):0}% difficult</strong></div><div class="directionRow"><span>English → Japanese</span><strong>${enc?Math.round(100*en/enc):0}% difficult</strong></div>`}
async function dictSearch(){const q=$('dictSearch').value.trim();if(!q)return;const out=$('dictResults');out.innerHTML='<p class="subtle">Searching the Japanese dictionary…</p>';const local=allCards().filter(c=>[c.front,c.reading,english(c)].join(' ').toLowerCase().includes(q.toLowerCase())).slice(0,8);let remote=[];try{const r=await fetch('https://jisho.org/api/v1/search/words?keyword='+encodeURIComponent(q));if(!r.ok)throw Error();const j=await r.json();remote=(j.data||[]).slice(0,20).map((x,i)=>{const ja=x.japanese?.[0]||{},defs=(x.senses||[]).flatMap(s=>s.english_definitions||[]).slice(0,6);return{id:x.slug||`${Date.now()}-${i}`,word:ja.word||ja.reading||x.slug,reading:ja.reading||'',en:defs.join('; '),common:!!x.is_common,jlpt:(x.jlpt||[]).join(', ')}});$('dictStatus').innerHTML='<span class="connectionDot"></span>Online JMdict/Jisho search active'}catch(e){$('dictStatus').innerHTML='<span class="connectionDot off"></span>Offline — showing saved/course entries only'}
const merged=[];for(const c of local)merged.push({id:c.id,word:c.front,reading:c.reading||'',en:english(c),local:true});for(const r of remote)if(!merged.some(x=>x.word===r.word&&x.reading===r.reading))merged.push(r);if(!merged.length){out.innerHTML='<div class="dictItem"><b>No result.</b></div>';return}out.innerHTML=merged.map(x=>`<div class="dictItem"><div class="jp">${esc(x.word)}</div><div class="rd">${esc(x.reading)}</div><div class="en">${esc(x.en||'')}</div><div class="dictMeta">${x.common?'Common · ':''}${esc(x.jlpt||'')}</div>${x.local?'':`<div class="dictActions"><button class="smallBtn" data-add="${esc(x.id)}">Add to learning</button></div>`}</div>`).join('');out.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const x=remote.find(r=>String(r.id)===b.dataset.add);if(!x)return;if(!personal.some(p=>p.word===x.word&&p.reading===x.reading)){personal.push({...x,level:(x.jlpt.match(/n[1-5]/i)?.[0]||'N5').toUpperCase()});save();renderHome()}b.textContent='Added ✓';b.disabled=true})}
function finishSession(){toast('Session complete');screen('home');renderHome();setTimeout(()=>ensureCurriculum().catch(()=>{}),0)}
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),1400)}
function bindUI(){
  const on=(id,event,fn)=>{const el=$(id);if(el)el.addEventListener(event,fn)};
  on('continueBtn','click',e=>{if(e&&e.preventDefault)e.preventDefault();
    const btn=$('continueBtn');
    try{
      // Start from the local audited curriculum immediately. Network curriculum loading must never block the UI.
      if(!(queue.length&&qi<queue.length))buildSession();
      screen('learn');
      showTask();
    }catch(e){console.error(e);toast('Could not start the lesson.');}
    finally{if(btn){btn.disabled=false;btn.innerHTML='Continue <span>→</span>'}}
  });
  on('closeLearn','click',()=>{screen('home');renderHome()});
  on('revealBtn','click',reveal);
  on('ratings','click',e=>{const b=e.target.closest('button[data-g]');if(b)grade(b.dataset.g)});
  document.querySelectorAll('.nav [data-screen]').forEach(b=>b.addEventListener('click',e=>{if(e&&e.preventDefault)e.preventDefault();const id=b.dataset.screen;if(activeScreen===id){screenScroll[id]=0;window.scrollTo({top:0,behavior:'smooth'})}else screen(id)}));
  on('settingsBtn','click',()=>screen('settings'));
  on('closeSettings','click',()=>screen('home'));
  on('dictBtn','click',dictSearch);
  on('dictSearch','keydown',e=>{if(e.key==='Enter')dictSearch()});
  on('vocabLearn','click',()=>startFocused('vocab'));
  on('kanaPractice','click',()=>startFocused('kana'));
  on('goalInput','change',e=>{settings.goal=Math.max(5,Math.min(100,Number(e.target.value)||20));e.target.value=settings.goal;save();renderHome()});
  on('newInput','change',e=>{settings.newLimit=Math.max(0,Math.min(50,Number(e.target.value)||0));e.target.value=settings.newLimit;save();renderHome()});
  on('romajiToggle','change',e=>{settings.showRomaji=e.target.checked;save()});
  on('resetBtn','click',()=>{if(confirm('Reset all learning progress?')){progress={};stats={reviews:0,streak:0,lastDay:'',days:{}};save();renderHome();toast('Progress reset')}});
}
function syncSettingsUI(){if($('goalInput'))$('goalInput').value=settings.goal;if($('newInput'))$('newInput').value=settings.newLimit;if($('romajiToggle'))$('romajiToggle').checked=settings.showRomaji}
function syncConnectionUI(){if(!$('dictStatus'))return;$('dictStatus').innerHTML=navigator.onLine?'<span class="connectionDot"></span>Online dictionary ready':'<span class="connectionDot off"></span>Offline — saved/course entries available'}
function syncViewport(){if(window.visualViewport)document.documentElement.style.setProperty('--vvh',window.visualViewport.height+'px')}
function boot(){
  bindUI();
  syncSettingsUI();
  syncConnectionUI();
  window.addEventListener('online',syncConnectionUI);
  window.addEventListener('offline',syncConnectionUI);
  syncViewport();
  if(window.visualViewport){window.visualViewport.addEventListener('resize',syncViewport);window.visualViewport.addEventListener('scroll',syncViewport)}
  try{renderHome()}catch(e){console.error('Initial render failed',e)}
  const loadCourse=()=>ensureCurriculum().catch(e=>console.warn('Background curriculum load failed',e));
  if('requestIdleCallback' in window)requestIdleCallback(loadCourse,{timeout:1800});else setTimeout(loadCourse,700);
  window.__RN_BOOTED=true;try{const badge=$('buildBadge');if(badge)badge.textContent='Build 18 · fast engine'}catch(e){}

window.RN_APP={
  go:function(id){try{screen(id);return true}catch(e){console.error(e);return false}},
  start:function(){try{if(!(queue.length&&qi<queue.length))buildSession();screen('learn');showTask();return true}catch(e){console.error(e);return false}}
};
}

try{boot()}catch(e){console.error('RETHINK.Nihongo boot failed',e);document.body?.classList.add('boot-error')}


