document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    
    // 요소들 선택
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsContainer = document.getElementById('results');
    const themeToggle = document.getElementById('themeToggle');
    const langToggle = document.getElementById('langToggle');
    const autocompleteDropdown = document.getElementById('autocomplete');
    const clearInput = document.getElementById('clearInput');
    
    // 요소 존재 확인
    console.log('Elements found:', {
        searchInput: !!searchInput,
        searchBtn: !!searchBtn,
        themeToggle: !!themeToggle,
        langToggle: !!langToggle,
        resultsContainer: !!resultsContainer
    });
    
    // 테마 관리
    let currentTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', currentTheme);
    
    // 북마크 캐시
    let allBookmarks = [];
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    
    // 테마 아이콘 업데이트
    function updateThemeIcon() {
        const icon = themeToggle?.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
        }
    }
    
    // 테마 토글 함수
    function toggleTheme() {
        console.log('Theme toggle clicked');
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
        updateThemeIcon();
    }
    
    // 언어 토글 함수
    function toggleLanguage() {
        console.log('Language toggle clicked');
        const currentLang = i18n.getCurrentLang();
        const newLang = currentLang === 'ko' ? 'en' : 'ko';
        i18n.setLang(newLang);
        
        // 현재 입력된 검색어가 있다면 다시 검색
        if (searchInput.value.trim()) {
            searchBookmarks();
        }
    }
    
    // 검색 함수
    function searchBookmarks() {
        console.log('Search button clicked');
        const query = searchInput.value.trim();
        
        if (!query) {
            showEmptyState();
            return;
        }
        
        showLoading();
        
        // Chrome API 사용
        chrome.bookmarks.search(query, function(results) {
            displayResults(results, query);
        });
    }
    
    // 결과 표시
    function displayResults(bookmarks, query) {
        resultsContainer.innerHTML = '';
        
        if (bookmarks.length === 0) {
            const noResultsText = i18n.t('noResults', { QUERY: query });
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <div class="case-folder">🕵️‍♂️</div>
                    <p>${noResultsText}</p>
                </div>
            `;
            return;
        }
        
        const resultsList = document.createElement('div');
        resultsList.className = 'results-list';
        
        bookmarks.forEach(bookmark => {
            if (bookmark.url) {
                const item = createBookmarkItem(bookmark, query);
                resultsList.appendChild(item);
            }
        });
        
        resultsContainer.appendChild(resultsList);
    }
    
    // 북마크 아이템 생성
    function createBookmarkItem(bookmark, query) {
        const item = document.createElement('div');
        item.className = 'bookmark-item';
        
        const title = bookmark.title || i18n.t('evidenceUnknown');
        const url = bookmark.url;
        const domain = new URL(url).hostname;
        
        item.innerHTML = `
            <div class="bookmark-title">${title}</div>
            <div class="bookmark-url">${domain}</div>
        `;
        
        item.addEventListener('click', () => {
            chrome.tabs.create({ url: bookmark.url });
            window.close();
        });
        
        return item;
    }
    
    // 로딩 상태
    function showLoading() {
        resultsContainer.innerHTML = `
            <div class="loading">
                <div class="case-folder">🔍</div>
                <p>${i18n.t('loading')}</p>
            </div>
        `;
    }
    
    // 빈 상태
    function showEmptyState() {
        const randomMessage = i18n.getRandomEmptyState();
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <div class="case-folder">${randomMessage.icon}</div>
                <p>${randomMessage.text}</p>
            </div>
        `;
    }
    
    // 지우기 버튼
    function clearSearch() {
        console.log('Clear button clicked');
        searchInput.value = '';
        clearInput.style.display = 'none';
        showEmptyState();
        searchInput.focus();
    }
    
    // 이벤트 리스너 설정 함수
    function setupEventListeners() {
        console.log('Setting up event listeners...');
        
        const themeToggle = document.getElementById('themeToggle');
        const langToggle = document.getElementById('langToggle');
        const searchBtn = document.getElementById('searchBtn');
        const clearInput = document.getElementById('clearInput');
        
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
            console.log('Theme toggle listener added');
        }
        
        if (langToggle) {
            langToggle.addEventListener('click', toggleLanguage);
            console.log('Language toggle listener added');
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', searchBookmarks);
            console.log('Search button listener added');
        }
        
        if (clearInput) {
            clearInput.addEventListener('click', clearSearch);
            console.log('Clear button listener added');
        }
    }
    
    // 전역으로 접근 가능하게 만들기
    window.setupEventListeners = setupEventListeners;
    
    // 이벤트 리스너 초기 설정
    setupEventListeners();
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchBookmarks();
            }
        });
        
        searchInput.addEventListener('input', function() {
            if (searchInput.value.trim()) {
                clearInput.style.display = 'flex';
            } else {
                clearInput.style.display = 'none';
            }
        });
        
        console.log('Search input listeners added');
    }
    
    // 초기화
    updateThemeIcon();
    showEmptyState();
    
    // i18n 초기화 (잠시 후)
    setTimeout(() => {
        if (typeof i18n !== 'undefined') {
            i18n.updateUI();
        }
    }, 100);
    
    console.log('Initialization complete');
});