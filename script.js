// Reactの機能を使えるようにする
const { useState, useEffect } = React;

// メインのペット育成コンポーネント
function VirtualPet() {
  // ペットの状態を管理（数値が高いほど良い状態）
  const [pet, setPet] = useState({
    name: 'ペット', // ペットの名前
    hunger: 80, // おなかの満腹度（0-100）
    happiness: 80, // ごきげん度（0-100）
    health: 100, // げんき度（0-100）
    energy: 90, // スタミナ（0-100）
    age: 0, // 年齢（時間経過でカウント）
    level: 1, // レベル
    exp: 0, // 経験値（0-100でレベルアップ）
    lastUpdate: Date.now() // 最後に更新した時刻
  });

  const [isDaytime, setIsDaytime] = useState(true); // 昼か夜か
  const [animation, setAnimation] = useState('idle'); // アニメーション状態
  const [message, setMessage] = useState(''); // 表示するメッセージ

  // ページを開いた時に、保存されたデータを読み込む
  useEffect(() => {
    const savedData = localStorage.getItem('virtual-pet');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        // 前回からの経過時間を計算（分単位）
        const timePassed = Math.floor((Date.now() - data.lastUpdate) / 60000);

        // 経過時間に応じてステータスを減少させる
        setPet({
          ...data,
          hunger: Math.max(0, data.hunger - timePassed * 2), // 1分で2減少
          happiness: Math.max(0, data.happiness - timePassed), // 1分で1減少
          energy: Math.max(0, data.energy - timePassed * 1.5), // 1分で1.5減少
          health: Math.max(0, data.health - (data.hunger < 20 || data.happiness < 20 ? timePassed : 0)) });

      } catch (error) {
        console.log('新しいペットを開始します');
      }
    }
  }, []);

  // 10秒ごとにステータスを自動的に減少させる
  useEffect(() => {
    const interval = setInterval(() => {
      setPet(prev => {
        const newPet = {
          ...prev,
          hunger: Math.max(0, prev.hunger - 0.5), // おなかが減る
          happiness: Math.max(0, prev.happiness - 0.3), // ごきげんが下がる
          energy: Math.max(0, prev.energy - 0.4), // スタミナが減る
          age: prev.age + 1, // 年齢が増える
          lastUpdate: Date.now() };


        // おなかかごきげんが低いと、げんきも減る
        if (newPet.hunger < 20 || newPet.happiness < 20) {
          newPet.health = Math.max(0, newPet.health - 0.5);
        }

        // 変更をlocalStorageに保存
        localStorage.setItem('virtual-pet', JSON.stringify(newPet));
        return newPet;
      });
    }, 10000); // 10000ミリ秒 = 10秒

    return () => clearInterval(interval); // クリーンアップ
  }, []);

  // ごはんをあげる
  const feedPet = () => {
    setPet(prev => {
      const newHunger = Math.min(100, prev.hunger + 30); // おなか+30（最大100）
      const newExp = prev.exp + 10; // 経験値+10
      const newLevel = prev.level + Math.floor(newExp / 100); // 100で1レベルアップ

      return {
        ...prev,
        hunger: newHunger,
        exp: newExp % 100, // 100を超えた分は次のレベルへ
        level: newLevel,
        lastUpdate: Date.now() };

    });
    setAnimation('eat');
    setMessage('もぐもぐ... 美味しい！');
    // 2秒後に元に戻す
    setTimeout(() => {
      setAnimation('idle');
      setMessage('');
    }, 2000);
  };

  // 一緒に遊ぶ
  const playWithPet = () => {
    setPet(prev => {
      const newHappiness = Math.min(100, prev.happiness + 25); // ごきげん+25
      const newEnergy = Math.max(0, prev.energy - 15); // スタミナ-15（遊ぶと疲れる）
      const newExp = prev.exp + 15; // 経験値+15
      const newLevel = prev.level + Math.floor(newExp / 100);

      return {
        ...prev,
        happiness: newHappiness,
        energy: newEnergy,
        exp: newExp % 100,
        level: newLevel,
        lastUpdate: Date.now() };

    });
    setAnimation('play');
    setMessage('わーい！楽しい！');
    setTimeout(() => {
      setAnimation('idle');
      setMessage('');
    }, 2000);
  };

  // 水をあげる
  const giveDrink = () => {
    setPet(prev => ({
      ...prev,
      health: Math.min(100, prev.health + 15), // げんき+15
      hunger: Math.min(100, prev.hunger + 10), // おなかも少し回復
      lastUpdate: Date.now() }));

    setAnimation('drink');
    setMessage('ごくごく... すっきり！');
    setTimeout(() => {
      setAnimation('idle');
      setMessage('');
    }, 2000);
  };

  // 寝かせる
  const letSleep = () => {
    // スタミナが90以上の時は寝ない
    if (pet.energy >= 90) {
      setMessage('まだ眠くないみたい...');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    setPet(prev => ({
      ...prev,
      energy: Math.min(100, prev.energy + 40), // スタミナ+40
      health: Math.min(100, prev.health + 10), // げんき+10
      lastUpdate: Date.now() }));

    setAnimation('sleep');
    setIsDaytime(false); // 夜にする
    setMessage('すやすや...');
    // 3秒後に起きる
    setTimeout(() => {
      setAnimation('idle');
      setIsDaytime(true); // 昼に戻す
      setMessage('よく寝た！');
      setTimeout(() => setMessage(''), 1500);
    }, 3000);
  };

  // ステータスバーの色を決める関数
  const getStatusColor = value => {
    if (value > 60) return 'bg-green-500'; // 緑：良好
    if (value > 30) return 'bg-yellow-500'; // 黄色：注意
    return 'bg-red-500'; // 赤：危険
  };

  // ペットの表情を決める関数
  const getPetExpression = () => {
    if (animation === 'sleep') return '😴'; // 寝てる
    if (animation === 'eat') return '😋'; // 食べてる
    if (animation === 'play') return '🤩'; // 遊んでる
    if (animation === 'drink') return '😊'; // 飲んでる
    if (pet.health < 30) return '😵'; // げんきがない
    if (pet.hunger < 30) return '😢'; // おなかすいた
    if (pet.happiness < 30) return '😔'; // 悲しい
    if (pet.energy < 30) return '😪'; // 眠い
    if (pet.happiness > 80) return '😄'; // とっても幸せ
    return '😊'; // 普通
  };

  // 画面の表示部分
  return /*#__PURE__*/(
    React.createElement("div", { className: `min-h-screen ${isDaytime ? 'bg-gradient-to-b from-sky-300 to-green-200' : 'bg-gradient-to-b from-indigo-900 to-purple-900'} p-6 transition-colors duration-1000` }, /*#__PURE__*/
    React.createElement("div", { className: "max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden" }, /*#__PURE__*/


    React.createElement("div", { className: "bg-gradient-to-r from-pink-400 to-purple-500 p-6 text-white" }, /*#__PURE__*/
    React.createElement("div", { className: "flex justify-between items-center" }, /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("h1", { className: "text-2xl font-bold" }, pet.name), /*#__PURE__*/
    React.createElement("p", { className: "text-sm opacity-90" }, "\u30EC\u30D9\u30EB ", pet.level, " \u2022 ", Math.floor(pet.age / 6), "\u65E5\u76EE")), /*#__PURE__*/

    React.createElement("div", { className: "text-4xl" }, isDaytime ? '☀️' : '🌙')), /*#__PURE__*/



    React.createElement("div", { className: "mt-4" }, /*#__PURE__*/
    React.createElement("div", { className: "flex justify-between text-xs mb-1" }, /*#__PURE__*/
    React.createElement("span", null, "EXP"), /*#__PURE__*/
    React.createElement("span", null, pet.exp, "/100")), /*#__PURE__*/

    React.createElement("div", { className: "w-full bg-white/30 rounded-full h-2" }, /*#__PURE__*/
    React.createElement("div", {
      className: "bg-yellow-300 h-2 rounded-full transition-all duration-500",
      style: { width: `${pet.exp}%` } })))), /*#__PURE__*/






    React.createElement("div", { className: "relative bg-gradient-to-b from-blue-50 to-green-50 p-8" }, /*#__PURE__*/
    React.createElement("div", { className: `text-center transition-all duration-500 ${animation === 'play' ? 'animate-bounce' : ''}` }, /*#__PURE__*/

    React.createElement("div", { className: `text-9xl mb-4 inline-block ${animation === 'sleep' ? 'opacity-70' : ''}` },
    getPetExpression()),


    message && /*#__PURE__*/
    React.createElement("div", { className: "bg-white rounded-2xl px-4 py-2 shadow-lg inline-block mb-4" }, /*#__PURE__*/
    React.createElement("p", { className: "text-sm font-medium text-gray-700" }, message))), /*#__PURE__*/





    React.createElement("div", { className: "space-y-3 mt-6" }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
    React.createElement("span", { className: "text-2xl" }, "\uD83C\uDF4E"), /*#__PURE__*/
    React.createElement("div", { className: "flex-1" }, /*#__PURE__*/
    React.createElement("div", { className: "flex justify-between text-xs mb-1" }, /*#__PURE__*/
    React.createElement("span", { className: "font-medium" }, "\u304A\u306A\u304B"), /*#__PURE__*/
    React.createElement("span", null, Math.round(pet.hunger), "%")), /*#__PURE__*/

    React.createElement("div", { className: "w-full bg-gray-200 rounded-full h-2" }, /*#__PURE__*/
    React.createElement("div", {
      className: `${getStatusColor(pet.hunger)} h-2 rounded-full transition-all duration-500`,
      style: { width: `${pet.hunger}%` } })))), /*#__PURE__*/






    React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
    React.createElement("span", { className: "text-2xl" }, "\u2728"), /*#__PURE__*/
    React.createElement("div", { className: "flex-1" }, /*#__PURE__*/
    React.createElement("div", { className: "flex justify-between text-xs mb-1" }, /*#__PURE__*/
    React.createElement("span", { className: "font-medium" }, "\u3054\u304D\u3052\u3093"), /*#__PURE__*/
    React.createElement("span", null, Math.round(pet.happiness), "%")), /*#__PURE__*/

    React.createElement("div", { className: "w-full bg-gray-200 rounded-full h-2" }, /*#__PURE__*/
    React.createElement("div", {
      className: `${getStatusColor(pet.happiness)} h-2 rounded-full transition-all duration-500`,
      style: { width: `${pet.happiness}%` } })))), /*#__PURE__*/






    React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
    React.createElement("span", { className: "text-2xl" }, "\u2764\uFE0F"), /*#__PURE__*/
    React.createElement("div", { className: "flex-1" }, /*#__PURE__*/
    React.createElement("div", { className: "flex justify-between text-xs mb-1" }, /*#__PURE__*/
    React.createElement("span", { className: "font-medium" }, "\u3052\u3093\u304D"), /*#__PURE__*/
    React.createElement("span", null, Math.round(pet.health), "%")), /*#__PURE__*/

    React.createElement("div", { className: "w-full bg-gray-200 rounded-full h-2" }, /*#__PURE__*/
    React.createElement("div", {
      className: `${getStatusColor(pet.health)} h-2 rounded-full transition-all duration-500`,
      style: { width: `${pet.health}%` } })))), /*#__PURE__*/






    React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
    React.createElement("span", { className: "text-2xl" }, "\u26A1"), /*#__PURE__*/
    React.createElement("div", { className: "flex-1" }, /*#__PURE__*/
    React.createElement("div", { className: "flex justify-between text-xs mb-1" }, /*#__PURE__*/
    React.createElement("span", { className: "font-medium" }, "\u30B9\u30BF\u30DF\u30CA"), /*#__PURE__*/
    React.createElement("span", null, Math.round(pet.energy), "%")), /*#__PURE__*/

    React.createElement("div", { className: "w-full bg-gray-200 rounded-full h-2" }, /*#__PURE__*/
    React.createElement("div", {
      className: `${getStatusColor(pet.energy)} h-2 rounded-full transition-all duration-500`,
      style: { width: `${pet.energy}%` } })))))), /*#__PURE__*/








    React.createElement("div", { className: "p-6 bg-gray-50" }, /*#__PURE__*/
    React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /*#__PURE__*/

    React.createElement("button", {
      onClick: feedPet,
      className: "bg-gradient-to-r from-red-400 to-pink-400 text-white rounded-xl py-4 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all active:scale-95" }, /*#__PURE__*/

    React.createElement("div", { className: "text-2xl mb-1" }, "\uD83C\uDF4E"), "\u3054\u306F\u3093"), /*#__PURE__*/



    React.createElement("button", {
      onClick: playWithPet,
      className: "bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-xl py-4 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all active:scale-95" }, /*#__PURE__*/

    React.createElement("div", { className: "text-2xl mb-1" }, "\u2728"), "\u3042\u305D\u3076"), /*#__PURE__*/



    React.createElement("button", {
      onClick: giveDrink,
      className: "bg-gradient-to-r from-blue-400 to-cyan-400 text-white rounded-xl py-4 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all active:scale-95" }, /*#__PURE__*/

    React.createElement("div", { className: "text-2xl mb-1" }, "\uD83D\uDCA7"), "\u307F\u305A"), /*#__PURE__*/



    React.createElement("button", {
      onClick: letSleep,
      className: "bg-gradient-to-r from-indigo-400 to-purple-400 text-white rounded-xl py-4 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all active:scale-95" }, /*#__PURE__*/

    React.createElement("div", { className: "text-2xl mb-1" }, "\uD83C\uDF19"), "\u306D\u308B"))))));







}

// アプリを起動
ReactDOM.render( /*#__PURE__*/React.createElement(VirtualPet, null), document.getElementById('root'));