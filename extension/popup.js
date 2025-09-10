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
        
        // 검색 기록 저장
        if (!searchHistory.includes(query)) {
            searchHistory.unshift(query);
            searchHistory = searchHistory.slice(0, 5);
            localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        }
        
        showLoading();
        
        // 한영 매핑 적용
        const korEngMapping = i18n.getKeywordMapping();
        const mappedQueries = [query];
        
        // 원본 쿼리에서 매핑 가능한 단어들을 찾아 추가 쿼리 생성
        for (const [source, target] of Object.entries(korEngMapping)) {
            if (query.toLowerCase().includes(source.toLowerCase())) {
                const mappedQuery = query.toLowerCase().replace(source.toLowerCase(), target);
                if (!mappedQueries.includes(mappedQuery)) {
                    mappedQueries.push(mappedQuery);
                }
            }
        }
        
        // 여러 쿼리로 검색 실행
        let allResults = [];
        let completedSearches = 0;
        
        mappedQueries.forEach(searchQuery => {
            chrome.bookmarks.search(searchQuery, function(results) {
                allResults = allResults.concat(results);
                completedSearches++;
                
                if (completedSearches === mappedQueries.length) {
                    // 중복 제거 (URL 기준)
                    const uniqueResults = allResults.filter((bookmark, index, self) => 
                        index === self.findIndex(b => b.url === bookmark.url)
                    );
                    displayResults(uniqueResults, query);
                }
            });
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
        autocompleteDropdown.style.display = 'none';
        showEmptyState();
        searchInput.focus();
    }
    
    // 검색기록 삭제 함수
    function deleteSearchHistory(index) {
        searchHistory.splice(index, 1);
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }
    
    // 최근 검색내역 표시
    function showRecentSearches() {
        if (searchHistory.length === 0) {
            autocompleteDropdown.style.display = 'none';
            return;
        }
        
        autocompleteDropdown.innerHTML = '';
        
        // 최근 검색내역 헤더 추가
        const header = document.createElement('div');
        header.className = 'autocomplete-header';
        header.textContent = i18n.t('recentSearches');
        autocompleteDropdown.appendChild(header);
        
        searchHistory.slice(0, 5).forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'autocomplete-item history-item';
            historyItem.innerHTML = `
                <span class="history-text">${item}</span>
                <span class="history-actions">
                    <span class="history-icon">🔍</span>
                    <span class="history-delete" data-index="${index}">×</span>
                </span>
            `;
            
            // 검색 실행
            historyItem.querySelector('.history-text').addEventListener('click', () => {
                searchInput.value = item;
                autocompleteDropdown.style.display = 'none';
                searchBookmarks();
            });
            
            historyItem.querySelector('.history-icon').addEventListener('click', () => {
                searchInput.value = item;
                autocompleteDropdown.style.display = 'none';
                searchBookmarks();
            });
            
            // 삭제 기능
            historyItem.querySelector('.history-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteSearchHistory(index);
                showRecentSearches(); // 목록 새로고침
            });
            
            autocompleteDropdown.appendChild(historyItem);
        });
        
        autocompleteDropdown.style.display = 'block';
    }
    
    // 자동완성 표시 (입력 시)
    function showAutocomplete(query) {
        if (!query) {
            autocompleteDropdown.style.display = 'none';
            return;
        }
        
        const suggestions = [];
        
        // 검색 기록에서 추천
        searchHistory.forEach(item => {
            if (item.toLowerCase().includes(query.toLowerCase()) && item !== query) {
                suggestions.push({ text: item, type: 'history' });
            }
        });
        
        // 한영 매핑 추천
        const korEngMapping = i18n.getKeywordMapping();
        for (const [source, target] of Object.entries(korEngMapping)) {
            if (source.toLowerCase().includes(query.toLowerCase()) && !suggestions.find(s => s.text === target)) {
                suggestions.push({ text: target, type: 'mapping' });
            }
            if (target.toLowerCase().includes(query.toLowerCase()) && !suggestions.find(s => s.text === source)) {
                suggestions.push({ text: source, type: 'mapping' });
            }
        }
        
        if (suggestions.length === 0) {
            autocompleteDropdown.style.display = 'none';
            return;
        }
        
        autocompleteDropdown.innerHTML = '';
        suggestions.slice(0, 5).forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = suggestion.text;
            item.addEventListener('click', () => {
                searchInput.value = suggestion.text;
                autocompleteDropdown.style.display = 'none';
                searchBookmarks();
            });
            autocompleteDropdown.appendChild(item);
        });
        
        autocompleteDropdown.style.display = 'block';
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
                autocompleteDropdown.style.display = 'none';
                searchBookmarks();
            }
        });
        
        // 검색 필드 hover 시 최근 검색내역 표시
        searchInput.addEventListener('mouseenter', function() {
            if (!searchInput.value.trim()) {
                showRecentSearches();
            }
        });
        
        // 포커스 시에도 최근 검색내역 표시
        searchInput.addEventListener('focus', function() {
            if (!searchInput.value.trim()) {
                showRecentSearches();
            }
        });
        
        // 검색 필드에서 마우스 벗어날 때 숨김 (단, 포커스 상태가 아닐 때만)
        searchInput.addEventListener('mouseleave', function() {
            if (!searchInput.matches(':focus') && !searchInput.value.trim()) {
                setTimeout(() => {
                    autocompleteDropdown.style.display = 'none';
                }, 200);
            }
        });
        
        // 입력 시 자동완성과 지우기 버튼 처리
        searchInput.addEventListener('input', function() {
            const query = searchInput.value.trim();
            
            // 지우기 버튼 표시/숨김
            if (query) {
                clearInput.style.display = 'flex';
                showAutocomplete(query);
            } else {
                clearInput.style.display = 'none';
                showRecentSearches();
            }
        });
        
        console.log('Search input listeners added');
    }
    
    // 자동완성 외부 클릭시 숨김
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
            autocompleteDropdown.style.display = 'none';
        }
    });
    
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