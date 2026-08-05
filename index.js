import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://dtgfdtsiggljqczvqcgy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8NKvxlnYvvD1ImNdYyj6Bg_DofuOnn1';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  if (error) return;

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

async function fetchAndDisplayTurn() {
  const { data, error } = await supabase
    .from('game_state')
    .select('current_turn')
    .eq('id', 'main')
    .single();

  if (error) return;

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

async function checkTradeOffer() {
  const selectedUser = document.getElementById('userSelect').value;
  const tradeOfferArea = document.getElementById('tradeOfferArea');

  const { data, error } = await supabase
    .from('game_state')
    .select('trade_offer')
    .eq('id', 'main')
    .single();

  if (error) return;

  const offer = data.trade_offer;

  if (offer && offer.to === selectedUser) {
    tradeOfferArea.style.display = 'block';
    // ★変更：メッセージに値段（offer.price）を追加
    tradeOfferArea.innerHTML = `
      <p><strong>${offer.from}</strong> さんから <strong>${offer.item}</strong> を <strong>${offer.price}</strong> 円で渡したいと提案が来ています。</p>
      <button id="acceptTradeBtn">承諾する (Yes)</button>
      <button id="rejectTradeBtn">断る (No)</button>
    `;

    document.getElementById('acceptTradeBtn').addEventListener('click', () => {
      alert('承諾しました！※アイテムと所持金移動の処理はこれから作ります');
    });

    document.getElementById('rejectTradeBtn').addEventListener('click', () => {
      alert('断りました！※提案を取り消す処理はこれから作ります');
    });

  } else {
    tradeOfferArea.style.display = 'none';
    tradeOfferArea.innerHTML = '';
  }
}

document.getElementById('userSelect').addEventListener('change', () => {
  fetchAndDisplayItems(); 
  fetchAndDisplayTurn();
  checkTradeOffer();
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
  // ★追加：入力された値段を取得（空欄の場合は0円にする）
  const priceToTrade = parseInt(document.getElementById('tradePriceInput').value) || 0;

  if (!itemToTrade) {
    alert('渡すアイテムを選んでください。');
    return;
  }

  // ★変更：提案データに price を追加
  const offerData = {
    from: fromUser,
    to: toUser,
    item: itemToTrade,
    price: priceToTrade
  };

  const { error } = await supabase
    .from('game_state')
    .update({ trade_offer: offerData })
    .eq('id', 'main');

  if (error) {
    alert('提案の送信に失敗しました。');
  } else {
    // ★変更：アラートにも値段を追加
    alert(`${toUser} に ${itemToTrade} を ${priceToTrade} 円で渡す提案を送信しました！`);
    document.getElementById('tradeSubmitBtn').disabled = true;
  }
});

supabase
  .channel('public:users')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
    fetchAndDisplayItems();
  })
  .subscribe();

supabase
  .channel('public:game_state_channel')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state' }, () => {
    fetchAndDisplayTurn();
    checkTradeOffer();
  })
  .subscribe();

fetchAndDisplayItems();
fetchAndDisplayTurn();
checkTradeOffer();
