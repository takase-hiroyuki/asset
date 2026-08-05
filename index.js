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
    tradeOfferArea.innerHTML = `
      <p><strong>${offer.from}</strong> さんから <strong>${offer.item}</strong> を <strong>${offer.price}</strong> 円で渡したいと提案が来ています。</p>
      <button id="acceptTradeBtn">承諾する (Yes)</button>
      <button id="rejectTradeBtn">断る (No)</button>
    `;

    // ==========================================
    // ★追加：承諾したときの処理（アイテムとお金の移動）
    // ==========================================
    document.getElementById('acceptTradeBtn').addEventListener('click', async () => {
      // 一時的にボタンを押せなくする
      document.getElementById('acceptTradeBtn').disabled = true;
      document.getElementById('rejectTradeBtn').disabled = true;

      try {
        // 1. 渡し手（from）の現在のデータを取得
        const { data: fromUser } = await supabase
          .from('users')
          .select('items, money')
          .eq('id', offer.from)
          .single();

        // 2. 受け手（to = 自分）の現在のデータを取得
        const { data: toUser } = await supabase
          .from('users')
          .select('items, money')
          .eq('id', offer.to)
          .single();

        // --- 渡し手のデータを計算 ---
        // 渡したアイテムをリストから1つだけ削除する
        const fromItems = [...(fromUser.items || [])];
        const itemIndex = fromItems.indexOf(offer.item);
        if (itemIndex > -1) {
          fromItems.splice(itemIndex, 1);
        }
        // お金をもらう
        const fromMoney = (fromUser.money || 0) + offer.price;

        // --- 受け手のデータを計算 ---
        // もらったアイテムをリストに追加する
        const toItems = [...(toUser.items || [])];
        toItems.push(offer.item);
        // お金を払う
        const toMoney = (toUser.money || 0) - offer.price;

        // 3. データベースを更新する（渡し手）
        await supabase
          .from('users')
          .update({ items: fromItems, money: fromMoney })
          .eq('id', offer.from);

        // 4. データベースを更新する（受け手）
        await supabase
          .from('users')
          .update({ items: toItems, money: toMoney })
          .eq('id', offer.to);

        // 5. 提案をリセットする
        await supabase
          .from('game_state')
          .update({ trade_offer: null })
          .eq('id', 'main');

        alert('取引が成立しました！');
      } catch (err) {
        console.error('取引エラー:', err);
        alert('取引の処理中にエラーが発生しました。');
      }
    });

    // ==========================================
    // ★追加：断ったときの処理（提案の取り消し）
    // ==========================================
    document.getElementById('rejectTradeBtn').addEventListener('click', async () => {
      document.getElementById('acceptTradeBtn').disabled = true;
      document.getElementById('rejectTradeBtn').disabled = true;

      const { error: resetError } = await supabase
        .from('game_state')
        .update({ trade_offer: null })
        .eq('id', 'main');

      if (resetError) {
        alert('拒否の処理に失敗しました。');
      } else {
        alert('提案を断りました。');
      }
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
  const priceToTrade = parseInt(document.getElementById('tradePriceInput').value) || 0;

  if (!itemToTrade) {
    alert('渡すアイテムを選んでください。');
    return;
  }

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
