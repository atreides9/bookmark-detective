document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsContainer = document.getElementById('results');
    const themeToggle = document.getElementById('themeToggle');
    const langToggle = document.getElementById('langToggle');
    const autocompleteDropdown = document.getElementById('autocomplete');
    const clearInput = document.getElementById('clearInput');
    
    // 글로벌 접근을 위한 객체 생성
    window.bookmarkDetective = {};
    
    // 테마 관리
    let currentTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', currentTheme);
    
    // 테마 아이콘 업데이트 함수
    function updateThemeIcon() {
        const icon = themeToggle.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
        }
    }
    
    // 초기 테마 아이콘 설정
    updateThemeIcon();
    
    // 자동완성을 위한 북마크 캐시
    let allBookmarks = [];
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    
    // 초기화 완료 후 실행할 함수들
    function initializeUI() {
        // 초기 빈 상태 표시
        showEmptyState();
        
        // UI 업데이트
        i18n.updateUI();
        
        console.log('UI 초기화 완료');
    }
    
    // DOM이 완전히 로드된 후 초기화 실행
    initializeUI();
    
    // 검색기록 삭제 함수
    function deleteSearchHistory(index) {
        searchHistory.splice(index, 1);
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }
    
    // 초기 북마크 로드
    loadAllBookmarks();
    
    // 모든 북마크 로드
    function loadAllBookmarks() {
        chrome.bookmarks.getTree(function(tree) {
            allBookmarks = [];
            extractBookmarks(tree[0]);
        });
    }
    
    // 북마크 트리에서 북마크 추출
    function extractBookmarks(node) {
        if (node.url) {
            allBookmarks.push({
                title: node.title,
                url: node.url
            });
        }
        if (node.children) {
            node.children.forEach(child => extractBookmarks(child));
        }
    }
    
    // 테마 토글
    function toggleTheme() {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
        updateThemeIcon();
    }
    
    // 언어 토글
    function toggleLanguage() {
        const currentLang = i18n.getCurrentLang();
        const newLang = currentLang === 'ko' ? 'en' : 'ko';
        i18n.setLang(newLang);
        
        // 현재 입력된 검색어가 있다면 다시 검색
        if (searchInput.value.trim()) {
            searchBookmarks();
        }
    }
    
    
    // 검색 실행 (한영 매핑 포함)
    function searchBookmarks() {
        const query = searchInput.value.trim();
        
        if (!query) {
            window.bookmarkDetective.showEmptyState();
            return;
        }
        
        // 검색 기록 저장
        if (!searchHistory.includes(query)) {
            searchHistory.unshift(query);
            searchHistory = searchHistory.slice(0, 10);
            localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        }
        
        showLoading();
        
        // 한영 매핑 적용
        const korEngMapping = i18n.getKeywordMapping();
        const mappedQueries = [query];
        for (const [kor, eng] of Object.entries(korEngMapping)) {
            if (query.toLowerCase().includes(kor)) {
                mappedQueries.push(query.toLowerCase().replace(kor, eng));
            }
            if (query.toLowerCase().includes(eng)) {
                mappedQueries.push(query.toLowerCase().replace(eng, kor));
            }
        }
        
        // 여러 쿼리로 검색
        let allResults = [];
        let completedSearches = 0;
        
        mappedQueries.forEach(searchQuery => {
            chrome.bookmarks.search(searchQuery, function(results) {
                allResults = allResults.concat(results);
                completedSearches++;
                
                if (completedSearches === mappedQueries.length) {
                    // 중복 제거
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
        
        const title = highlightText(bookmark.title || i18n.t('evidenceUnknown'), query);
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
    
    // 검색어 하이라이트
    function highlightText(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
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
        
        // 북마크 제목에서 추천
        allBookmarks.forEach(bookmark => {
            if (bookmark.title.toLowerCase().includes(query.toLowerCase()) && 
                !suggestions.find(s => s.text === bookmark.title)) {
                suggestions.push({ text: bookmark.title, type: 'bookmark' });
            }
        });
        
        // 한영 매핑 추천
        const korEngMapping = i18n.getKeywordMapping();
        for (const [kor, eng] of Object.entries(korEngMapping)) {
            if (kor.includes(query) && !suggestions.find(s => s.text === eng)) {
                suggestions.push({ text: eng, type: 'mapping' });
            }
            if (eng.includes(query.toLowerCase()) && !suggestions.find(s => s.text === kor)) {
                suggestions.push({ text: kor, type: 'mapping' });
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
    
    // 로딩 상태 표시
    function showLoading() {
        resultsContainer.innerHTML = `
            <div class="loading">
                <div class="case-folder">🔍</div>
                <p>${i18n.t('loading')}</p>
            </div>
        `;
    }
    
    // 빈 상태 표시 (랜덤 메시지)
    function showEmptyState() {
        const randomMessage = i18n.getRandomEmptyState();
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <div class="case-folder">${randomMessage.icon}</div>
                <p>${randomMessage.text}</p>
            </div>
        `;
    }
    
    // 글로벌 접근을 위한 함수
    window.bookmarkDetective.showEmptyState = showEmptyState;
    
    
    // 이벤트 리스너
    themeToggle.addEventListener('click', toggleTheme);
    langToggle.addEventListener('click', toggleLanguage);
    searchBtn.addEventListener('click', searchBookmarks);
    
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
    
    // 검색 필드에서 마우스 벗어날 때 숨김 (단, 포커스 상태가 아닐 때만)
    searchInput.addEventListener('mouseleave', function() {
        if (!searchInput.matches(':focus') && !searchInput.value.trim()) {
            autocompleteDropdown.style.display = 'none';
        }
    });
    
    // 포커스 시에도 최근 검색내역 표시
    searchInput.addEventListener('focus', function() {
        if (!searchInput.value.trim()) {
            showRecentSearches();
        }
    });
    
    // 입력 필드 지우기 버튼 표시/숨김
    function toggleClearButton() {
        if (searchInput.value.trim()) {
            clearInput.style.display = 'flex';
        } else {
            clearInput.style.display = 'none';
        }
    }
    
    // 입력 필드 지우기 기능
    clearInput.addEventListener('click', function() {
        searchInput.value = '';
        clearInput.style.display = 'none';
        autocompleteDropdown.style.display = 'none';
        window.bookmarkDetective.showEmptyState();
        searchInput.focus();
    });
    
    // 자동완성 및 실시간 검색
    let debounceTimer;
    searchInput.addEventListener('input', function() {
        const query = searchInput.value.trim();
        
        clearTimeout(debounceTimer);
        
        // 지우기 버튼 표시/숨김
        toggleClearButton();
        
        // 입력 시작하면 자동완성 표시 (최근 검색내역 숨김)
        if (query) {
            showAutocomplete(query);
        } else {
            // 입력이 비어있으면 최근 검색내역 다시 표시
            showRecentSearches();
        }
        
        // 검색은 디바운싱 적용
        debounceTimer = setTimeout(() => {
            if (query) {
                searchBookmarks();
            } else {
                window.bookmarkDetective.showEmptyState();
            }
        }, 400);
    });
    
    // 자동완성 외부 클릭시 숨김
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
            autocompleteDropdown.style.display = 'none';
        }
    });
    
    // 포커스 설정 제거 - hover 시에만 최근 검색내역 표시
});