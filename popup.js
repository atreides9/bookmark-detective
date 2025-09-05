document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsContainer = document.getElementById('results');
    
    // 검색 실행
    function searchBookmarks() {
        const query = searchInput.value.trim();
        
        if (!query) {
            showEmptyState();
            return;
        }
        
        showLoading();
        
        // Chrome bookmarks API를 사용하여 검색
        chrome.bookmarks.search(query, function(results) {
            displayResults(results, query);
        });
    }
    
    // 결과 표시
    function displayResults(bookmarks, query) {
        resultsContainer.innerHTML = '';
        
        if (bookmarks.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <p>🤔 "${query}"와 관련된 북마크를 찾을 수 없습니다</p>
                    <p>다른 키워드로 시도해보세요</p>
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
        
        const title = highlightText(bookmark.title || '제목 없음', query);
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
    
    // 로딩 상태 표시
    function showLoading() {
        resultsContainer.innerHTML = `
            <div class="loading">
                <p>🔍 북마크를 찾는 중...</p>
            </div>
        `;
    }
    
    // 빈 상태 표시
    function showEmptyState() {
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <p>북마크를 찾고 계신가요?<br>키워드를 입력해보세요!</p>
            </div>
        `;
    }
    
    // 이벤트 리스너
    searchBtn.addEventListener('click', searchBookmarks);
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchBookmarks();
        }
    });
    
    // 입력 시 실시간 검색 (디바운싱 적용)
    let debounceTimer;
    searchInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (searchInput.value.trim()) {
                searchBookmarks();
            } else {
                showEmptyState();
            }
        }, 300);
    });
    
    // 포커스 설정
    searchInput.focus();
});