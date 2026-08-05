import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabaseの設定
const SUPABASE_URL = 'https://dtgfdtsiggljqczvqcgy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8NKvxlnYvvD1ImNdYyj6Bg_DofuOnn1';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. 選択されたユーザーのアイテムと所持金を取得して表示する関数
async function fetchAndDisplayItems() {
  const selectedUser = document.getElementById('userSelect').value;
  const myItemsList = document.getElementById('myItemsList');
  const myMoneyDisplay = document.getElementById('myMoneyDisplay');
  const tradeItemSelect = document.getElementById('tradeItemSelect');
  const tradeTargetSelect = document.getElementById('tradeTargetSelect');

  myItemsList.innerHTML = '<li>読み込み中...</li>';
  myMoneyDisplay.textContent = '所持金: 読み込み中...';
  
  tradeItemSelect.innerHTML = '<option value="">-- 選択してください --</option>';
  tradeTargetSelect.innerHTML = ''; 

  const allUsers = ['user1', 'user2', 'user3'];
  allUsers.forEach(u => {
    if (u !== selectedUser) {
      const option = document.createElement('option');
      option.value = u;
      option.textContent = u;
      tradeTargetSelect.appendChild(option);
    }
  });

  const { data, error } = await supabase
    .from('users')
    .select('items, money')
    .eq('id', selectedUser)
    .single();

  if (error) {
    console.error('データの取得エラー:', error);
    myItemsList.innerHTML = '<li>データの取得に失敗しました</li>';
    myMoneyDisplay.textContent = '所持金: 取得エラー';
    return;
  }

  myMoneyDisplay.textContent = `所持金: ${data.money}`;
  myItemsList.innerHTML = '';
  const items = data.items || [];

  if (items.length === 0) {
    myItemsList.innerHTML = '<li>アイテムを持っていません</li>';
    return;
  }

  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    myItemsList.appendChild(li);

    const option = document.createElement('option');
    option.value = item;
    option.textContent = item;
    tradeItemSelect.appendChild(option);
  });
}

// 2. 現在の手番を取得して画面に表示する関数
async function fetchAndDisplayTurn() {
  const { data, error } = await supabase
    .from('game_state')
    .select('current_turn')
    .eq('id', 'main')
    .single();

  if (error) {
    console.error('手番の取得エラー:', error);
    document.getElementById('currentTurnDisplay').textContent = '現在の手番: 取得エラー';
    return;
  }

  const currentTurn = data.current_turn;
  document.getElementById('currentTurnDisplay').textContent = `現在の手番: ${currentTurn}`;

  const selectedUser = document.getElementById('userSelect').value;
  const nextTurnBtn = document.getElementById('nextTurnBtn');
  const tradeSubmitBtn = document.getElementById('tradeSubmitBtn'); 

  if (currentTurn === selectedUser) {
    nextTurnBtn.disabled = false;
    tradeSubmitBtn.disabled = false; 
  } else {
    nextTurnBtn.disabled = true;
    tradeSubmitBtn.disabled = true;  
  }
}

// ★追加3. 取引の提案が来ているかチェックして画面に表示する関数
async function checkTradeOffer() {
  const selectedUser = document.getElementById('userSelect').value;
  const tradeOfferArea = document.getElementById('tradeOfferArea');

  // game_stateから現在のtrade_offerを取得
  const { data, error } = await supabase
    .from('game_state')
    .select('trade_offer')
    .eq('id', 'main')
    .single();

  if (error) {
    console.error('取引データの取得エラー:', error);
    return;
  }

  const offer = data.trade_offer;

  // 提案が存在し、かつ「自分宛て」の場合のみ表示する
  if (offer && offer.to === selectedUser) {
    tradeOfferArea.style.display = 'block';
    tradeOfferArea.innerHTML = `
      <p><strong>${offer.from}</strong> さんから <strong>${offer.item}</strong> を渡したいと提案が来ています。</p>
      <button id="acceptTradeBtn">承諾する (Yes)</button>
      <button id="rejectTradeBtn">断る (No)</button>
    `;

    // 承諾ボタンの処理（今はアラートが出るだけ）
    document.getElementById('acceptTradeBtn').addEventListener('click', () => {
      alert('承諾しました！※アイテム移動の処理はこれから作ります');
    });

    // 断るボタンの処理（今はアラートが出るだけ）
    document.getElementById('rejectTradeBtn').addEventListener('click', () => {
      alert('断りました！※提案を取り消す処理はこれから作ります');
    });

  } else {
    // 提案がない、または自分宛てでなければ非表示にする
    tradeOfferArea.style.display = 'none';
    tradeOfferArea.innerHTML = '';
  }
}

// ==========================================
// イベントリスナー（ボタンや操作の設定）
// ==========================================

document.getElementById('userSelect').addEventListener('change', () => {
  fetchAndDisplayItems(); 
  fetchAndDisplayTurn();
  checkTradeOffer(); // ★ユーザーを切り替えた時にも提案をチェックする
});

document.getElementById('nextTurnBtn').addEventListener('click', async () => {
  const { data, error } = await supabase
    .from('game_state')
    .select('current_turn')
    .eq('id', 'main')
    .single();

  if (error) return;

  const current = data.current_turn;
  let nextTurn = '';
  if (current === 'user1') nextTurn = 'user2';
  else if (current === 'user2') nextTurn = 'user3';
  else nextTurn = 'user1';

  await supabase
    .from('game_state')
    .update({ current_turn: nextTurn })
    .eq('id', 'main');
});

document.getElementById('tradeSubmitBtn').addEventListener('click', async () => {
  const fromUser = document.getElementById('userSelect').value;
  const itemToTrade = document.getElementById('tradeItemSelect').value;
  const toUser = document.getElementById('tradeTargetSelect').value;

  if (!itemToTrade) {
    alert('渡すアイテムを選んでください。');
    return;
  }

  const offerData = {
    from: fromUser,
    to: toUser,
    item: itemToTrade
  };

  const { error } = await supabase
    .from('game_state')
    .update({ trade_offer: offerData })
    .eq('id', 'main');

  if (error) {
    console.error('提案の送信エラー:', error);
    alert('提案の送信に失敗しました。');
  } else {
    alert(`${toUser} に ${itemToTrade} を渡す提案を送信しました！`);
    document.getElementById('tradeSubmitBtn').disabled = true;
  }
});

// ==========================================
// リアルタイム通信の監視設定
// ==========================================

supabase
  .channel('public:users')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'users' },
    (payload) => {
      fetchAndDisplayItems();
    }
  )
  .subscribe();

supabase
  .channel('public:game_state_channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'game_state' },
    (payload) => {
      fetchAndDisplayTurn();
      checkTradeOffer(); // ★誰かが提案を送信（game_stateが更新）されたら、即座にチェックする
    }
  )
  .subscribe();

// ==========================================
// 初期表示の実行
// ==========================================
fetchAndDisplayItems();
fetchAndDisplayTurn();
checkTradeOffer(); // ★画面を開いた時にも提案をチェックする
