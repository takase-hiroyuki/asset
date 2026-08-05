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
  
  // ★追加：取引メニューのプルダウン
  const tradeItemSelect = document.getElementById('tradeItemSelect');
  const tradeTargetSelect = document.getElementById('tradeTargetSelect');

  myItemsList.innerHTML = '<li>読み込み中...</li>';
  myMoneyDisplay.textContent = '所持金: 読み込み中...';
  
  // ★追加：プルダウンの初期化
  tradeItemSelect.innerHTML = '<option value="">-- 選択してください --</option>';
  tradeTargetSelect.innerHTML = ''; 

  // ★追加：自分以外のユーザーを「渡す相手」プルダウンにセット
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
    // 画面のリストに追加
    const li = document.createElement('li');
    li.textContent = item;
    myItemsList.appendChild(li);

    // ★追加：渡すアイテムのプルダウンにも追加
    const option = document.createElement('option');
    option.value = item;
    option.textContent = item;
    tradeItemSelect.appendChild(option);
  });
}

// 2. 現在の手番を取得して画面に表示する関数（ボタンの有効・無効を判定）
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
  const tradeSubmitBtn = document.getElementById('tradeSubmitBtn'); // ★追加：提案ボタン

  if (currentTurn === selectedUser) {
    nextTurnBtn.disabled = false;
    tradeSubmitBtn.disabled = false; // ★自分の手番なら提案ボタンを押せる
  } else {
    nextTurnBtn.disabled = true;
    tradeSubmitBtn.disabled = true;  // ★自分の手番でなければ提案ボタンを押せない
  }
}

// ==========================================
// イベントリスナー（ボタンや操作の設定）
// ==========================================

// セレクトボックスの選択が切り替わったとき
document.getElementById('userSelect').addEventListener('change', () => {
  fetchAndDisplayItems(); 
  fetchAndDisplayTurn();  
});

// 手番を次の人に回すボタンの処理
document.getElementById('nextTurnBtn').addEventListener('click', async () => {
  console.log('--- 手番変更処理スタート ---');
  
  const { data, error } = await supabase
    .from('game_state')
    .select('current_turn')
    .eq('id', 'main')
    .single();

  if (error) {
    console.error('現在の手番の確認に失敗しました:', error);
    alert('手番の確認に失敗しました。');
    return;
  }

  const current = data.current_turn;
  let nextTurn = '';
  if (current === 'user1') nextTurn = 'user2';
  else if (current === 'user2') nextTurn = 'user3';
  else nextTurn = 'user1';

  console.log(`${current} から ${nextTurn} へ手番を更新します...`);

  const { error: updateError } = await supabase
    .from('game_state')
    .update({ current_turn: nextTurn })
    .eq('id', 'main');

  if (updateError) {
    console.error('手番の更新エラー:', updateError);
    alert('手番の更新に失敗しました。');
  } else {
    console.log('手番の更新に成功しました！');
  }
});

// ==========================================
// リアルタイム通信の監視設定
// ==========================================

// usersテーブルの監視
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

// game_stateテーブルの監視
supabase
  .channel('public:game_state_channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'game_state' },
    (payload) => {
      fetchAndDisplayTurn();
    }
  )
  .subscribe();

// ==========================================
// 初期表示の実行
// ==========================================
fetchAndDisplayItems();
fetchAndDisplayTurn();
