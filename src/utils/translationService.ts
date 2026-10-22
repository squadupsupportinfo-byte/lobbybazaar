// Comprehensive in-app translation dictionary for major languages + DOM translation engine

export interface TranslationDictionary {
  [key: string]: {
    [lang: string]: string;
  };
}

export const COMMON_TRANSLATIONS: TranslationDictionary = {
  // Navigation & Branding
  'SquadUp': {
    es: 'SquadUp',
    ja: 'スクワッドアップ',
    ko: '스쿼드업',
    pt: 'SquadUp',
    fr: 'SquadUp',
    de: 'SquadUp',
    'zh-CN': '战队集结',
    'zh-TW': '戰隊集結',
    it: 'SquadUp',
    ru: 'СквадАп',
    ar: 'سكواد اب',
    tl: 'SquadUp',
    vi: 'SquadUp',
    tr: 'SquadUp',
  },
  'Tactical Map & Players': {
    es: 'Mapa Táctico y Jugadores',
    ja: '戦術マップ＆プレイヤー',
    ko: '전술 지도 및 플레이어',
    pt: 'Mapa Tático e Jogadores',
    fr: 'Carte Tactique et Joueurs',
    de: 'Taktische Karte & Spieler',
    'zh-CN': '战术地图与玩家',
    'zh-TW': '戰術地圖與玩家',
    it: 'Mappa Tattica e Giocatori',
    ru: 'Тактическая карта и игроки',
    ar: 'الخريطة التكتيكية واللاعبين',
    tl: 'Taktikal na Mapa at mga Manlalaro',
    vi: 'Bản đồ Chiến thuật & Game thủ',
    tr: 'Taktik Harita ve Oyuncular',
  },
  'Replay Intro': {
    es: 'Repetir Intro',
    ja: 'イントロ再生',
    ko: '인트로 재생',
    pt: 'Repetir Intro',
    fr: 'Rejouer Intro',
    de: 'Intro wiederholen',
    'zh-CN': '重放介绍',
    'zh-TW': '重播介紹',
    it: 'Ripeti Intro',
    ru: 'Повторить интро',
    ar: 'إعادة المقدمة',
    tl: 'Ulitin ang Intro',
    vi: 'Xem lại Intro',
    tr: 'Girişi Tekrarla',
  },
  'Terms & 18+ Rules': {
    es: 'Términos y Reglas 18+',
    ja: '利用規約＆18歳以上ルール',
    ko: '이용약관 및 18세 이상 규칙',
    pt: 'Termos e Regras 18+',
    fr: 'Conditions et Règles 18+',
    de: 'AGB & 18+ Regeln',
    'zh-CN': '条款与18+规则',
    'zh-TW': '條款與18+規則',
    it: 'Termini e Regole 18+',
    ru: 'Условия и правила 18+',
    ar: 'الشروط وقواعد 18+',
    tl: 'Mga Tuntunin at 18+ Batas',
    vi: 'Điều khoản & Quy tắc 18+',
    tr: 'Şartlar ve 18+ Kuralları',
  },
  'Sign In': {
    es: 'Iniciar Sesión',
    ja: 'サインイン',
    ko: '로그인',
    pt: 'Entrar',
    fr: 'Connexion',
    de: 'Anmelden',
    'zh-CN': '登录',
    'zh-TW': '登入',
    it: 'Accedi',
    ru: 'Войти',
    ar: 'تسجيل الدخول',
    tl: 'Mag-sign In',
    vi: 'Đăng nhập',
    tr: 'Giriş Yap',
  },
  'Create Account': {
    es: 'Crear Cuenta',
    ja: 'アカウント作成',
    ko: '계정 생성',
    pt: 'Criar Conta',
    fr: 'Créer un Compte',
    de: 'Konto erstellen',
    'zh-CN': '创建账号',
    'zh-TW': '建立帳號',
    it: 'Crea Account',
    ru: 'Создать аккаунт',
    ar: 'إنشاء حساب',
    tl: 'Gumawa ng Account',
    vi: 'Tạo tài khoản',
    tr: 'Hesap Oluştur',
  },
  'Friends': {
    es: 'Amigos',
    ja: 'フレンド',
    ko: '친구',
    pt: 'Amigos',
    fr: 'Amis',
    de: 'Freunde',
    'zh-CN': '好友',
    'zh-TW': '好友',
    it: 'Amici',
    ru: 'Друзья',
    ar: 'الأصدقاء',
    tl: 'Mga Kaibigan',
    vi: 'Bạn bè',
    tr: 'Arkadaşlar',
  },
  'Log Out': {
    es: 'Cerrar Sesión',
    ja: 'ログアウト',
    ko: '로그아웃',
    pt: 'Sair',
    fr: 'Déconnexion',
    de: 'Abmelden',
    'zh-CN': '退出',
    'zh-TW': '登出',
    it: 'Esci',
    ru: 'Выйти',
    ar: 'تسجيل الخروج',
    tl: 'Mag-log Out',
    vi: 'Đăng xuất',
    tr: 'Çıkış Yap',
  },
  'PROFILE': {
    es: 'PERFIL',
    ja: 'プロフィール',
    ko: '프로필',
    pt: 'PERFIL',
    fr: 'PROFIL',
    de: 'PROFIL',
    'zh-CN': '个人资料',
    'zh-TW': '個人資料',
    it: 'PROFILO',
    ru: 'ПРОФИЛЬ',
    ar: 'الملف الشخصي',
    tl: 'PROFILE',
    vi: 'HỒ SƠ',
    tr: 'PROFİL',
  },

  // Map & Radar Actions
  'DEPLOY RADAR PIN': {
    es: 'DESPLEGAR PIN RADAR',
    ja: 'レーダーピンを配置',
    ko: '레이더 핀 배치',
    pt: 'IMPLANTAR PIN RADAR',
    fr: 'DÉPLOYER PIN RADAR',
    de: 'RADAR-PIN PLATZIEREN',
    'zh-CN': '部署雷达图钉',
    'zh-TW': '部署雷達圖釘',
    it: 'PUBBLICA PIN RADAR',
    ru: 'РАЗМЕСТИТЬ ПИН РАДАРА',
    ar: 'نشر نقطة الرادار',
    tl: 'I-DEPLOY ANG RADAR PIN',
    vi: 'TRIỂN KHAI GHIM RADAR',
    tr: 'RADAR PİNİ YERLEŞTİR',
  },
  'CREATE CHAT ROOM': {
    es: 'CREAR SALA DE CHAT',
    ja: 'チャットルーム作成',
    ko: '채팅방 만들기',
    pt: 'CRIAR SALA DE CHAT',
    fr: 'CRÉER SALON DE DISCUSSION',
    de: 'CHATRAUM ERSTELLEN',
    'zh-CN': '创建聊天室',
    'zh-TW': '建立聊天室',
    it: 'CREA STANZA CHAT',
    ru: 'СОЗДАТЬ ЧАТ-КОМНАТУ',
    ar: 'إنشاء غرفة دردشة',
    tl: 'GUMAWA NG CHAT ROOM',
    vi: 'TẠO PHÒNG CHAT',
    tr: 'SOHBET ODASI OLUŞTUR',
  },
  'CREATE STORE': {
    es: 'CREAR TIENDA',
    ja: 'ストア作成',
    ko: '스토어 만들기',
    pt: 'CRIAR LOJA',
    fr: 'CRÉER UNE BOUTIQUE',
    de: 'STORE ERSTELLEN',
    'zh-CN': '创建商店',
    'zh-TW': '建立商店',
    it: 'CREA NEGOZIO',
    ru: 'СОЗДАТЬ МАГАЗИН',
    ar: 'إنشاء متجر',
    tl: 'GUMAWA NG TINDAHAN',
    vi: 'TẠO CỬA HÀNG',
    tr: 'MAĞAZA OLUŞTUR',
  },
  'LIVE CHAT': {
    es: 'CHAT EN VIVO',
    ja: 'ライブチャット',
    ko: '라이브 채팅',
    pt: 'CHAT AO VIVO',
    fr: 'CHAT EN DIRECT',
    de: 'LIVE-CHAT',
    'zh-CN': '实时聊天',
    'zh-TW': '即時聊天',
    it: 'CHAT DAL VIVO',
    ru: 'ЖИВОЙ ЧАТ',
    ar: 'دردشة مباشرة',
    tl: 'LIVE NA CHAT',
    vi: 'TRÒ CHUYỆN TRỰC TIẾP',
    tr: 'CANLI SOHBET',
  },

  // Chat Room Actions & Voice
  'Mic On': {
    es: 'Micrófono Activado',
    ja: 'マイク オン',
    ko: '마이크 켜짐',
    pt: 'Microfone Ligado',
    fr: 'Micro Activé',
    de: 'Mikrofon An',
    'zh-CN': '开启麦克风',
    'zh-TW': '開啟麥克風',
    it: 'Microfono Attivo',
    ru: 'Микрофон включен',
    ar: 'تشغيل المايك',
    tl: 'Bukas ang Mic',
    vi: 'Bật Mic',
    tr: 'Mikrofon Açık',
  },
  'Mic Off': {
    es: 'Micrófono Desactivado',
    ja: 'マイク オフ',
    ko: '마이크 꺼짐',
    pt: 'Microfone Desligado',
    fr: 'Micro Désactivé',
    de: 'Mikrofon Aus',
    'zh-CN': '关闭麦克风',
    'zh-TW': '關閉麥克風',
    it: 'Microfono Spento',
    ru: 'Микрофон выключен',
    ar: 'كتم المايك',
    tl: 'Patay ang Mic',
    vi: 'Tắt Mic',
    tr: 'Mikrofon Kapalı',
  },
  'Close Room': {
    es: 'Cerrar Sala',
    ja: 'ルームを閉じる',
    ko: '방 닫기',
    pt: 'Fechar Sala',
    fr: 'Fermer le Salon',
    de: 'Raum Schließen',
    'zh-CN': '关闭房间',
    'zh-TW': '關閉房間',
    it: 'Chiudi Stanza',
    ru: 'Закрыть комнату',
    ar: 'إغلاق الغرفة',
    tl: 'Isara ang Room',
    vi: 'Đóng phòng',
    tr: 'Odayı Kapat',
  },
  'Share': {
    es: 'Compartir',
    ja: '共有',
    ko: '공유',
    pt: 'Compartilhar',
    fr: 'Partager',
    de: 'Teilen',
    'zh-CN': '分享',
    'zh-TW': '分享',
    it: 'Condividi',
    ru: 'Поделиться',
    ar: 'مشاركة',
    tl: 'Ibahagi',
    vi: 'Chia sẻ',
    tr: 'Paylaş',
  },
  'Send': {
    es: 'Enviar',
    ja: '送信',
    ko: '전송',
    pt: 'Enviar',
    fr: 'Envoyer',
    de: 'Senden',
    'zh-CN': '发送',
    'zh-TW': '傳送',
    it: 'Invia',
    ru: 'Отправить',
    ar: 'إرسال',
    tl: 'Ipadala',
    vi: 'Gửi',
    tr: 'Gönder',
  },
  'Type a tactical squad message...': {
    es: 'Escribe un mensaje táctico para el escuadrón...',
    ja: '戦術スクワッドメッセージを入力...',
    ko: '전술 스쿼드 메시지 입력...',
    pt: 'Digite uma mensagem tática para o esquadrão...',
    fr: 'Tapez un message tactique pour l\'escouade...',
    de: 'Geben Sie eine taktische Nachricht ein...',
    'zh-CN': '输入战术队伍消息...',
    'zh-TW': '輸入戰術隊伍訊息...',
    it: 'Scrivi un messaggio tattico per la squadra...',
    ru: 'Введите тактическое сообщение для сквада...',
    ar: 'اكتب رسالة تكتيكية للفريق...',
    tl: 'Mag-type ng mensahe para sa squad...',
    vi: 'Nhập tin nhắn chiến thuật cho đội...',
    tr: 'Taktiksel ekip mesajı yazın...',
  },

  // Status & Badges
  '5 GAMERS': {
    es: '5 JUGADORES',
    ja: '5人のゲーマー',
    ko: '게이머 5명',
    pt: '5 JOGADORES',
    fr: '5 JOUEURS',
    de: '5 SPIELER',
    'zh-CN': '5位玩家',
    'zh-TW': '5位玩家',
    it: '5 GIOCATORI',
    ru: '5 ГЕЙМЕРОВ',
    ar: '5 لاعبين',
    tl: '5 MANLALARO',
    vi: '5 GAME THỦ',
    tr: '5 OYUNCU',
  },
  '5 GAMERS (HOST INCL.)': {
    es: '5 JUGADORES (ANFITRIÓN INCL.)',
    ja: '5名（ホスト含む）',
    ko: '게이머 5명 (호스트 포함)',
    pt: '5 JOGADORES (HOST INCL.)',
    fr: '5 JOUEURS (HÔTE INCLUS)',
    de: '5 SPIELER (INKL. HOST)',
    'zh-CN': '5位玩家（含房主）',
    'zh-TW': '5位玩家（含房主）',
    it: '5 GIOCATORI (HOST INCL.)',
    ru: '5 ГЕЙМЕРОВ (ВКЛ. ХОСТА)',
    ar: '5 لاعبين (شامل المضيف)',
    tl: '5 MANLALARO (KASAMA ANG HOST)',
    vi: '5 GAME THỦ (GỒM CHỦ PHÒNG)',
    tr: '5 OYUNCU (KURUCU DAHİL)',
  },
  'Limit: 5 Gamers': {
    es: 'Límite: 5 Jugadores',
    ja: '上限: 5名',
    ko: '제한: 5명',
    pt: 'Limite: 5 Jogadores',
    fr: 'Limite: 5 Joueurs',
    de: 'Limit: 5 Spieler',
    'zh-CN': '上限：5位玩家',
    'zh-TW': '上限：5位玩家',
    it: 'Limite: 5 Giocatori',
    ru: 'Лимит: 5 геймеров',
    ar: 'الحد الأقصى: 5 لاعبين',
    tl: 'Limitasyon: 5 Manlalaro',
    vi: 'Giới hạn: 5 Game thủ',
    tr: 'Sınır: 5 Oyuncu',
  },
  'Limit: 5 Gamers (Host Included)': {
    es: 'Límite: 5 Jugadores (Anfitrión Incluido)',
    ja: '上限: 5名（ホスト含む）',
    ko: '제한: 5명 (호스트 포함)',
    pt: 'Limite: 5 Jogadores (Host Incluído)',
    fr: 'Limite: 5 Joueurs (Hôte Inclus)',
    de: 'Limit: 5 Spieler (Inkl. Host)',
    'zh-CN': '上限：5位玩家（包含房主）',
    'zh-TW': '上限：5位玩家（包含房主）',
    it: 'Limite: 5 Giocatori (Host Incluso)',
    ru: 'Лимит: 5 геймеров (включая хоста)',
    ar: 'الحد الأقصى: 5 لاعبين (شامل المضيف)',
    tl: 'Limitasyon: 5 Manlalaro (Kasama ang Host)',
    vi: 'Giới hạn: 5 Game thủ (Bao gồm chủ phòng)',
    tr: 'Sınır: 5 Oyuncu (Kurucu Dahil)',
  },
  '10 GAMERS': {
    es: '10 JUGADORES',
    ja: '10人のゲーマー',
    ko: '게이머 10명',
    pt: '10 JOGADORES',
    fr: '10 JOUEURS',
    de: '10 SPIELER',
    'zh-CN': '10位玩家',
    'zh-TW': '10位玩家',
    it: '10 GIOCATORI',
    ru: '10 ГЕЙМЕРОВ',
    ar: '10 لاعبين',
    tl: '10 MANLALARO',
    vi: '10 GAME THỦ',
    tr: '10 OYUNCU',
  },
  'Limit: 10 Gamers': {
    es: 'Límite: 10 Jugadores',
    ja: '上限: 10名',
    ko: '제한: 10명',
    pt: 'Limite: 10 Jogadores',
    fr: 'Limite: 10 Joueurs',
    de: 'Limit: 10 Spieler',
    'zh-CN': '上限：10位玩家',
    'zh-TW': '上限：10位玩家',
    it: 'Limite: 10 Giocatori',
    ru: 'Лимит: 10 геймеров',
    ar: 'الحد الأقصى: 10 لاعبين',
    tl: 'Limitasyon: 10 Manlalaro',
    vi: 'Giới hạn: 10 Game thủ',
    tr: 'Sınır: 10 Oyuncu',
  },
  'ROOM FULL': {
    es: 'SALA LLENA',
    ja: '満員',
    ko: '방 가득 참',
    pt: 'SALA CHEIA',
    fr: 'SALON COMPLET',
    de: 'RAUM VOLL',
    'zh-CN': '房间已满',
    'zh-TW': '房間已滿',
    it: 'STANZA PIENA',
    ru: 'КОМНАТА ПОЛНА',
    ar: 'الغرفة ممتلئة',
    tl: 'PUNO ANG ROOM',
    vi: 'PHÒNG ĐÃ ĐẦY',
    tr: 'ODA DOLU',
  },
  'CLICK TO CHAT': {
    es: 'CLIC PARA CHATEAR',
    ja: 'クリックしてチャット',
    ko: '클릭하여 채팅',
    pt: 'CLIQUE PARA CONVERSAR',
    fr: 'CLIQUER POUR DISCUTER',
    de: 'KLICKEN ZUM CHATTEN',
    'zh-CN': '点击聊天',
    'zh-TW': '點擊聊天',
    it: 'CLICCA PER CHATTARE',
    ru: 'НАЖМИТЕ ДЛЯ ЧАТА',
    ar: 'انقر للدردشة',
    tl: 'I-CLICK PARA MAKIPAG-CHAT',
    vi: 'NHẤP ĐỂ TRÒ CHUYỆN',
    tr: 'SOHBET ETMEK İÇİN TIKLA',
  },
  'CLICK TO VIEW': {
    es: 'CLIC PARA VER',
    ja: 'クリックして表示',
    ko: '클릭하여 보기',
    pt: 'CLIQUE PARA VER',
    fr: 'CLIQUER POUR VOIR',
    de: 'KLICKEN ZUM ANSEHEN',
    'zh-CN': '点击查看',
    'zh-TW': '點擊查看',
    it: 'CLICCA PER VEDERE',
    ru: 'НАЖМИТЕ ДЛЯ ПРОСМОТРА',
    ar: 'انقر للعرض',
    tl: 'I-CLICK PARA TINGNAN',
    vi: 'NHẤP ĐỂ XEM',
    tr: 'GÖRÜNTÜLEMEK İÇİN TIKLA',
  },

  // Edit Profile & Controls
  'Edit Profile': {
    es: 'Editar Perfil',
    ja: 'プロフィール編集',
    ko: '프로필 수정',
    pt: 'Editar Perfil',
    fr: 'Modifier le Profil',
    de: 'Profil bearbeiten',
    'zh-CN': '编辑资料',
    'zh-TW': '編輯個人資料',
    it: 'Modifica Profilo',
    ru: 'Редактировать профиль',
    ar: 'تعديل الملف الشخصي',
    tl: 'I-edit ang Profile',
    vi: 'Chỉnh sửa Hồ sơ',
    tr: 'Profili Düzenle',
  },
  'Save Changes': {
    es: 'Guardar Cambios',
    ja: '変更を保存',
    ko: '변경사항 저장',
    pt: 'Salvar Alterações',
    fr: 'Enregistrer',
    de: 'Änderungen speichern',
    'zh-CN': '保存更改',
    'zh-TW': '儲存變更',
    it: 'Salva Modifiche',
    ru: 'Сохранить изменения',
    ar: 'حفظ التغييرات',
    tl: 'I-save ang mga Pagbabago',
    vi: 'Lưu thay đổi',
    tr: 'Değişiklikleri Kaydet',
  },
  'Cancel': {
    es: 'Cancelar',
    ja: 'キャンセル',
    ko: '취소',
    pt: 'Cancelar',
    fr: 'Annuler',
    de: 'Abbrechen',
    'zh-CN': '取消',
    'zh-TW': '取消',
    it: 'Annulla',
    ru: 'Отмена',
    ar: 'إلغاء',
    tl: 'Kanselahin',
    vi: 'Hủy bỏ',
    tr: 'İptal',
  },
  'Close': {
    es: 'Cerrar',
    ja: '閉じる',
    ko: '닫기',
    pt: 'Fechar',
    fr: 'Fermer',
    de: 'Schließen',
    'zh-CN': '关闭',
    'zh-TW': '關閉',
    it: 'Chiudi',
    ru: 'Закрыть',
    ar: 'إغلاق',
    tl: 'Isara',
    vi: 'Đóng',
    tr: 'Kapat',
  },
  'Accept': {
    es: 'Aceptar',
    ja: '承認',
    ko: '수락',
    pt: 'Aceitar',
    fr: 'Accepter',
    de: 'Annehmen',
    'zh-CN': '接受',
    'zh-TW': '接受',
    it: 'Accetta',
    ru: 'Принять',
    ar: 'قبول',
    tl: 'Tanggapin',
    vi: 'Chấp nhận',
    tr: 'Kabul Et',
  },
  'Decline': {
    es: 'Rechazar',
    ja: '拒否',
    ko: '거절',
    pt: 'Recusar',
    fr: 'Refuser',
    de: 'Ablehnen',
    'zh-CN': '拒绝',
    'zh-TW': '拒絕',
    it: 'Rifiuta',
    ru: 'Отклонить',
    ar: 'رفض',
    tl: 'Tanggihan',
    vi: 'Từ chối',
    tr: 'Reddet',
  },
  'View Requests': {
    es: 'Ver Solicitudes',
    ja: 'リクエストを見る',
    ko: '요청 보기',
    pt: 'Ver Solicitações',
    fr: 'Voir les Demandes',
    de: 'Anfragen anzeigen',
    'zh-CN': '查看请求',
    'zh-TW': '查看請求',
    it: 'Visualizza Richieste',
    ru: 'Смотреть заявки',
    ar: 'عرض الطلبات',
    tl: 'Tingnan ang Kahilingan',
    vi: 'Xem yêu cầu',
    tr: 'İstekleri Görüntüle',
  },
  'Reply & Chat': {
    es: 'Responder y Chatear',
    ja: '返信＆チャット',
    ko: '답장 및 채팅',
    pt: 'Responder e Conversar',
    fr: 'Répondre et Discuter',
    de: 'Antworten & Chatten',
    'zh-CN': '回复与聊天',
    'zh-TW': '回覆與聊天',
    it: 'Rispondi e Chatta',
    ru: 'Ответить и общаться',
    ar: 'رد ودردش',
    tl: 'Sumagot at Mag-chat',
    vi: 'Trả lời & Trò chuyện',
    tr: 'Yanıtla ve Sohbet Et',
  },
  'Online': {
    es: 'En línea',
    ja: 'オンライン',
    ko: '온라인',
    pt: 'Online',
    fr: 'En ligne',
    de: 'Online',
    'zh-CN': '在线',
    'zh-TW': '線上',
    it: 'Online',
    ru: 'В сети',
    ar: 'متصل',
    tl: 'Online',
    vi: 'Trực tuyến',
    tr: 'Çevrimiçi',
  },
  'Offline': {
    es: 'Desconectado',
    ja: 'オフライン',
    ko: '오프라인',
    pt: 'Offline',
    fr: 'Hors ligne',
    de: 'Offline',
    'zh-CN': '离线',
    'zh-TW': '離線',
    it: 'Disconnesso',
    ru: 'Не в сети',
    ar: 'غير متصل',
    tl: 'Offline',
    vi: 'Ngoại tuyến',
    tr: 'Çevrimdışı',
  },
  'Active Now': {
    es: 'Activo Ahora',
    ja: '現在アクティブ',
    ko: '지금 활동 중',
    pt: 'Ativo Agora',
    fr: 'Actif Maintenant',
    de: 'Jetzt Aktiv',
    'zh-CN': '当前活跃',
    'zh-TW': '目前活躍',
    it: 'Attivo Ora',
    ru: 'Сейчас активен',
    ar: 'نشط الآن',
    tl: 'Aktibo Ngayon',
    vi: 'Đang hoạt động',
    tr: 'Şimdi Aktif',
  },
  'Join Squad': {
    es: 'Unirse al Escuadrón',
    ja: 'スクワッドに参加',
    ko: '스쿼드 참여',
    pt: 'Entrar no Esquadrão',
    fr: 'Rejoindre l\'Escouade',
    de: 'Squad Beitreten',
    'zh-CN': '加入战队',
    'zh-TW': '加入戰隊',
    it: 'Unisciti alla Squadra',
    ru: 'Вступить в сквад',
    ar: 'الانضمام إلى الفريق',
    tl: 'Sumali sa Squad',
    vi: 'Tham gia Đội',
    tr: 'Ekibe Katıl',
  },
  'Members': {
    es: 'Miembros',
    ja: 'メンバー',
    ko: '멤버',
    pt: 'Membros',
    fr: 'Membres',
    de: 'Mitglieder',
    'zh-CN': '成员',
    'zh-TW': '成員',
    it: 'Membri',
    ru: 'Участники',
    ar: 'الأعضاء',
    tl: 'Mga Miyembro',
    vi: 'Thành viên',
    tr: 'Üyeler',
  },
  'Search': {
    es: 'Buscar',
    ja: '検索',
    ko: '검색',
    pt: 'Buscar',
    fr: 'Rechercher',
    de: 'Suchen',
    'zh-CN': '搜索',
    'zh-TW': '搜尋',
    it: 'Cerca',
    ru: 'Поиск',
    ar: 'بحث',
    tl: 'Maghanap',
    vi: 'Tìm kiếm',
    tr: 'Ara',
  },
  'Message': {
    es: 'Mensaje',
    ja: 'メッセージ',
    ko: '메시지',
    pt: 'Mensagem',
    fr: 'Message',
    de: 'Nachricht',
    'zh-CN': '消息',
    'zh-TW': '訊息',
    it: 'Messaggio',
    ru: 'Сообщение',
    ar: 'رسالة',
    tl: 'Mensahe',
    vi: 'Tin nhắn',
    tr: 'Mesaj',
  },
  'Follow': {
    es: 'Seguir',
    ja: 'フォロー',
    ko: '팔로우',
    pt: 'Seguir',
    fr: 'Suivre',
    de: 'Folgen',
    'zh-CN': '关注',
    'zh-TW': '追蹤',
    it: 'Segui',
    ru: 'Подписаться',
    ar: 'متابعة',
    tl: 'Sundan',
    vi: 'Theo dõi',
    tr: 'Takip Et',
  },
  'Following': {
    es: 'Siguiendo',
    ja: 'フォロー中',
    ko: '팔로잉',
    pt: 'Seguindo',
    fr: 'Abonné',
    de: 'Gefolgt',
    'zh-CN': '已关注',
    'zh-TW': '已追蹤',
    it: 'Seguiti',
    ru: 'Подписки',
    ar: 'متابع',
    tl: 'Sinusundan',
    vi: 'Đang theo dõi',
    tr: 'Takip Edilen',
  },
  'Followers': {
    es: 'Seguidores',
    ja: 'フォロワー',
    ko: '팔로워',
    pt: 'Seguidores',
    fr: 'Abonnés',
    de: 'Follower',
    'zh-CN': '粉丝',
    'zh-TW': '粉絲',
    it: 'Follower',
    ru: 'Подписчики',
    ar: 'المتابعون',
    tl: 'Mga Tagasubaybay',
    vi: 'Người theo dõi',
    tr: 'Takipçiler',
  },
  'Add Friend': {
    es: 'Añadir Amigo',
    ja: 'フレンド追加',
    ko: '친구 추가',
    pt: 'Adicionar Amigo',
    fr: 'Ajouter un Ami',
    de: 'Freund hinzufügen',
    'zh-CN': '添加好友',
    'zh-TW': '新增好友',
    it: 'Aggiungi Amico',
    ru: 'Добавить друга',
    ar: 'إضافة صديق',
    tl: 'Magdagdag ng Kaibigan',
    vi: 'Thêm bạn',
    tr: 'Arkadaş Ekle',
  },
  'I Agree': {
    es: 'Acepto',
    ja: '同意する',
    ko: '동의합니다',
    pt: 'Concordo',
    fr: 'J\'accepte',
    de: 'Ich stimme zu',
    'zh-CN': '我同意',
    'zh-TW': '我同意',
    it: 'Accetto',
    ru: 'Я согласен',
    ar: 'أوافق',
    tl: 'Sumasang-ayon ako',
    vi: 'Tôi đồng ý',
    tr: 'Kabul Ediyorum',
  },
};

// Case-insensitive lookup map
const LOWERCASE_DICT: Record<string, { [lang: string]: string }> = {};
Object.entries(COMMON_TRANSLATIONS).forEach(([k, v]) => {
  LOWERCASE_DICT[k.toLowerCase().trim()] = v;
});

// Translates a string using dictionary or returns original
export function translateText(text: string, targetLang: string): string {
  if (!text || targetLang === 'en') return text;
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  
  if (COMMON_TRANSLATIONS[trimmed] && COMMON_TRANSLATIONS[trimmed][targetLang]) {
    return COMMON_TRANSLATIONS[trimmed][targetLang];
  }
  if (LOWERCASE_DICT[lower] && LOWERCASE_DICT[lower][targetLang]) {
    return LOWERCASE_DICT[lower][targetLang];
  }
  return text;
}

// In-memory + sessionStorage translation cache
const translationCache: Record<string, Map<string, string>> = {};
const reverseCache: Record<string, Map<string, string>> = {}; // translated -> original English

function getCache(lang: string): Map<string, string> {
  if (!translationCache[lang]) {
    translationCache[lang] = new Map();
    reverseCache[lang] = new Map();
    try {
      if (typeof sessionStorage !== 'undefined') {
        const stored = sessionStorage.getItem(`sq_trans_${lang}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          Object.entries(parsed).forEach(([k, v]) => {
            translationCache[lang].set(k, v as string);
            reverseCache[lang].set((v as string).trim(), k.trim());
          });
        }
      }
    } catch {
      // Ignore storage error
    }
  }
  return translationCache[lang];
}

function saveCache(lang: string) {
  try {
    if (typeof sessionStorage === 'undefined') return;
    const map = translationCache[lang];
    if (!map) return;
    const obj: Record<string, string> = {};
    map.forEach((v, k) => {
      obj[k] = v;
    });
    sessionStorage.setItem(`sq_trans_${lang}`, JSON.stringify(obj));
  } catch {
    // Ignore quota error
  }
}

// Translate single item with fallback: Google free endpoint -> MyMemory API
async function translateSingle(text: string, targetLang: string): Promise<string | null> {
  // Provider 1: Google gtx endpoint
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const translated = (data[0] || []).map((item: any) => item[0]).join('');
      if (translated && translated.trim()) {
        return translated.trim();
      }
    }
  } catch {
    // Proceed to fallback
  }

  // Provider 2: MyMemory Translated API
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${encodeURIComponent(targetLang)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        const trans = data.responseData.translatedText.trim();
        if (trans && !trans.toLowerCase().startsWith('warning:') && trans !== text) {
          return trans;
        }
      }
    }
  } catch {
    // Fallback error
  }

  return null;
}

// Batch translate text list with fast parallel chunking + direct array extraction + fallback
export async function translateBatch(texts: string[], targetLang: string): Promise<Record<string, string>> {
  if (!texts.length || targetLang === 'en') return {};

  const cache = getCache(targetLang);
  const result: Record<string, string> = {};
  const needed: string[] = [];

  for (const t of texts) {
    const trimmed = t.trim();
    if (!trimmed) continue;

    // 1. Check in-app dictionary
    const dictMatch = translateText(trimmed, targetLang);
    if (dictMatch && dictMatch !== trimmed) {
      result[trimmed] = dictMatch;
      continue;
    }

    // 2. Check local cache
    if (cache.has(trimmed)) {
      result[trimmed] = cache.get(trimmed)!;
      continue;
    }

    needed.push(trimmed);
  }

  if (!needed.length) return result;

  // Process items in parallel chunks of 20
  const chunkSize = 20;
  const chunks: string[][] = [];
  for (let i = 0; i < needed.length; i += chunkSize) {
    chunks.push(needed.slice(i, i + chunkSize));
  }

  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const joined = chunk.join('\n');
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(joined)}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data[0])) {
            data[0].forEach((item: any, idx: number) => {
              if (Array.isArray(item)) {
                const trans = (item[0] || '').replace(/\n+$/, '').trim();
                const orig = (item[1] || '').replace(/\n+$/, '').trim();
                if (orig && trans) {
                  result[orig] = trans;
                  cache.set(orig, trans);
                  if (!reverseCache[targetLang]) reverseCache[targetLang] = new Map();
                  reverseCache[targetLang].set(trans, orig);
                }
                if (chunk[idx] && trans) {
                  result[chunk[idx]] = trans;
                  cache.set(chunk[idx], trans);
                  if (!reverseCache[targetLang]) reverseCache[targetLang] = new Map();
                  reverseCache[targetLang].set(trans, chunk[idx]);
                }
              }
            });
          }
        }
      } catch {
        // Fall to individual fallback
      }

      // Parallel fallback for any items in chunk that remain missing
      const missing = chunk.filter((orig) => !result[orig]);
      if (missing.length > 0) {
        await Promise.allSettled(
          missing.map(async (item) => {
            const single = await translateSingle(item, targetLang);
            if (single) {
              result[item] = single;
              cache.set(item, single);
              if (!reverseCache[targetLang]) reverseCache[targetLang] = new Map();
              reverseCache[targetLang].set(single, item);
            }
          })
        );
      }
    })
  );

  saveCache(targetLang);
  return result;
}

// Active DOM text node replacement engine for full-page translation
const originalTextMap = new WeakMap<Node, string>();
const processedNodes = new Set<Node>();
let activeTargetLang = 'en';
let activeObserver: MutationObserver | null = null;
let isTranslatingDOM = false;

// Helper to resolve the true original English text from a text node
function getOriginalEnglish(raw: string, currentTargetLang: string): string {
  const trimmed = raw.trim();
  // 1. Check if trimmed is already known in our dictionary
  if (COMMON_TRANSLATIONS[trimmed] || LOWERCASE_DICT[trimmed.toLowerCase()]) {
    return trimmed;
  }
  // 2. Check reverse cache from translated back to English
  if (currentTargetLang && reverseCache[currentTargetLang]?.has(trimmed)) {
    return reverseCache[currentTargetLang].get(trimmed)!;
  }
  // 3. Check all target lang reverse caches
  for (const lang of Object.keys(reverseCache)) {
    if (reverseCache[lang]?.has(trimmed)) {
      return reverseCache[lang].get(trimmed)!;
    }
  }
  return raw;
}

export async function applyDOMTranslation(targetLang: string): Promise<void> {
  if (typeof document === 'undefined') return;

  const previousTargetLang = activeTargetLang;
  activeTargetLang = targetLang;

  // If resetting to English, restore all original text nodes and placeholder attributes
  if (targetLang === 'en') {
    if (activeObserver) {
      activeObserver.disconnect();
      activeObserver = null;
    }
    isTranslatingDOM = true;
    processedNodes.forEach((node) => {
      if (node.isConnected && originalTextMap.has(node)) {
        node.nodeValue = originalTextMap.get(node) || '';
      }
    });

    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[data-orig-placeholder], textarea[data-orig-placeholder]').forEach((el) => {
      if (el.dataset.origPlaceholder) {
        el.placeholder = el.dataset.origPlaceholder;
      }
    });

    document.querySelectorAll<HTMLElement>('[data-orig-title]').forEach((el) => {
      if (el.dataset.origTitle) {
        el.title = el.dataset.origTitle;
      }
    });

    setTimeout(() => {
      isTranslatingDOM = false;
    }, 50);
    return;
  }

  isTranslatingDOM = true;

  // 1. Walk DOM to collect candidate text nodes
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toLowerCase();
        if (['script', 'style', 'noscript', 'code', 'svg', 'canvas'].includes(tag)) {
          return NodeFilter.FILTER_REJECT;
        }
        // Only skip the language selector modal and translation trigger button themselves
        if (parent.closest('#language-translator-modal, #language-translator-btn, [data-no-translate="true"]')) {
          return NodeFilter.FILTER_REJECT;
        }
        const raw = node.nodeValue || '';
        const trimmed = raw.trim();
        // Skip pure whitespace, single symbols, pure numbers
        if (!trimmed || trimmed.length < 2 || /^[\d\s.,:;+\-_/\\!@#$%^&*()[\]{}|<>="']+$/.test(trimmed)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const nodesToProcess: Node[] = [];
  let currentNode = walker.nextNode();
  while (currentNode) {
    nodesToProcess.push(currentNode);
    currentNode = walker.nextNode();
  }

  // 2. Collect input/textarea placeholders and titles
  const inputElements = Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[placeholder], textarea[placeholder]')
  ).filter((el) => !el.closest('#language-translator-modal, #language-translator-btn, [data-no-translate="true"]'));

  const titledElements = Array.from(
    document.querySelectorAll<HTMLElement>('[title]')
  ).filter((el) => el.title && !el.closest('#language-translator-modal, #language-translator-btn, [data-no-translate="true"]'));

  const cache = getCache(targetLang);
  const uncachedTexts = new Set<string>();

  // 3. Instant synchronous pass for dictionary & cached phrases
  nodesToProcess.forEach((node) => {
    processedNodes.add(node);
    const raw = node.nodeValue || '';

    // If node was not tracked yet, ascertain whether it holds English or already translated text
    if (!originalTextMap.has(node)) {
      const origEnglish = getOriginalEnglish(raw, previousTargetLang);
      originalTextMap.set(node, origEnglish);
    }

    const original = originalTextMap.get(node) || raw;
    const trimmed = original.trim();

    const dictTrans = translateText(trimmed, targetLang);
    if (dictTrans && dictTrans !== trimmed) {
      const leading = original.match(/^\s*/)?.[0] || '';
      const trailing = original.match(/\s*$/)?.[0] || '';
      node.nodeValue = leading + dictTrans + trailing;
    } else if (cache.has(trimmed)) {
      const rep = cache.get(trimmed)!;
      const leading = original.match(/^\s*/)?.[0] || '';
      const trailing = original.match(/\s*$/)?.[0] || '';
      node.nodeValue = leading + rep + trailing;
    } else {
      uncachedTexts.add(trimmed);
    }
  });

  inputElements.forEach((el) => {
    if (!el.dataset.origPlaceholder) {
      el.dataset.origPlaceholder = getOriginalEnglish(el.placeholder, previousTargetLang);
    }
    const orig = el.dataset.origPlaceholder.trim();
    const dictTrans = translateText(orig, targetLang);
    if (dictTrans && dictTrans !== orig) {
      el.placeholder = dictTrans;
    } else if (cache.has(orig)) {
      el.placeholder = cache.get(orig)!;
    } else if (orig && orig.length > 1) {
      uncachedTexts.add(orig);
    }
  });

  titledElements.forEach((el) => {
    if (!el.dataset.origTitle) {
      el.dataset.origTitle = getOriginalEnglish(el.title, previousTargetLang);
    }
    const orig = el.dataset.origTitle.trim();
    const dictTrans = translateText(orig, targetLang);
    if (dictTrans && dictTrans !== orig) {
      el.title = dictTrans;
    } else if (cache.has(orig)) {
      el.title = cache.get(orig)!;
    }
  });

  isTranslatingDOM = false;

  // 4. Batch translate remaining texts online with fallback
  if (uncachedTexts.size > 0) {
    const translations = await translateBatch(Array.from(uncachedTexts), targetLang);
    isTranslatingDOM = true;

    nodesToProcess.forEach((node) => {
      if (!node.isConnected) return;
      const original = originalTextMap.get(node) || '';
      const trimmed = original.trim();
      if (translations[trimmed]) {
        const rep = translations[trimmed];
        const leading = original.match(/^\s*/)?.[0] || '';
        const trailing = original.match(/\s*$/)?.[0] || '';
        node.nodeValue = leading + rep + trailing;
      }
    });

    inputElements.forEach((el) => {
      if (!el.isConnected) return;
      const orig = (el.dataset.origPlaceholder || '').trim();
      if (translations[orig]) {
        el.placeholder = translations[orig];
      }
    });

    isTranslatingDOM = false;
  }

  // 5. Setup dynamic MutationObserver so newly mounted React components stay translated
  if (!activeObserver && typeof MutationObserver !== 'undefined') {
    let debounceTimer: any = null;
    activeObserver = new MutationObserver((mutations) => {
      if (isTranslatingDOM || activeTargetLang === 'en') return;
      // Only trigger if actual new nodes were added
      const hasAddedNodes = mutations.some((m) => m.addedNodes && m.addedNodes.length > 0);
      if (!hasAddedNodes) return;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!isTranslatingDOM && activeTargetLang !== 'en') {
          applyDOMTranslation(activeTargetLang);
        }
      }, 100);
    });

    activeObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false,
    });
  }
}
