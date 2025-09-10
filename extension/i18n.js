// 다국어 지원을 위한 번역 시스템
class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('language') || 'en';
        this.translations = {
            ko: {
                // 헤더
                title: '북마크 흥신소',
                subtitle: 'DETECTIVE AGENCY',
                
                // 검색
                searchPlaceholder: '단서를 입력하세요...',
                searchButton: '수사 시작',
                
                // 빈 상태 메시지들
                emptyStates: [
                    {
                        icon: '📁',
                        text: '잃어버린 북마크 사건 접수 중...<br>단서를 제공해주세요!'
                    },
                    {
                        icon: '🔍',
                        text: '미해결 북마크 사건이 쌓여있습니다...<br>키워드로 단서를 찾아보세요!'
                    },
                    {
                        icon: '📋',
                        text: '북마크 실종 신고를 기다리고 있습니다...<br>어떤 흔적을 찾고 계신가요?'
                    },
                    {
                        icon: '🕵️‍♂️',
                        text: '탐정이 대기 중입니다...<br>수사할 키워드를 알려주세요!'
                    },
                    {
                        icon: '💼',
                        text: '새로운 의뢰를 기다리는 중...<br>어떤 북마크를 찾아드릴까요?'
                    },
                    {
                        icon: '🗂️',
                        text: '사건 파일이 정리되어 있습니다...<br>검색어로 사건을 열어보세요!'
                    }
                ],
                
                // 검색 상태
                loading: '사건 파일을 뒤지는 중...<br>잠시만 기다려주세요',
                noResults: '"$QUERY" 단서로는 증거를 찾을 수 없습니다<br>다른 단서를 시도해보세요',
                evidenceUnknown: '증거 미상',
                
                // 자동완성
                recentSearches: '🕐 최근 수사 기록',
                
                // 설정
                settings: '설정',
                language: '언어',
                theme: '테마',
                darkMode: '다크 모드',
                lightMode: '라이트 모드',
                korean: '한국어',
                english: 'English'
            },
            en: {
                // 헤더
                title: 'Bookmark Sleuth',
                subtitle: 'DETECTIVE AGENCY',
                
                // 검색
                searchPlaceholder: 'Bookmark clues...',
                searchButton: 'Find',
                
                // 빈 상태 메시지들
                emptyStates: [
                    {
                        icon: '🔍',
                        text: 'Case files ready for investigation...<br>What evidence shall we examine?'
                    },
                    {
                        icon: '📂',
                        text: 'The archives await your inquiry...<br>Every bookmark tells a story.'
                    },
                    {
                        icon: '🕵️‍♂️',
                        text: 'Detective on duty...<br>Describe what you\'re looking for.'
                    },
                    {
                        icon: '🗃️',
                        text: 'Cold cases waiting to be solved...<br>Your search could crack the mystery.'
                    },
                    {
                        icon: '🔦',
                        text: 'Shining light on digital mysteries...<br>Let\'s uncover your lost bookmark.'
                    },
                    {
                        icon: '📋',
                        text: 'Investigation board is clear...<br>Ready to connect the dots?'
                    },
                    {
                        icon: '🎯',
                        text: 'Target acquired... almost there...<br>Give me something to track.'
                    },
                    {
                        icon: '🧩',
                        text: 'Missing pieces of the puzzle...<br>Help me solve this bookmark mystery.'
                    }
                ],
                
                // 검색 상태
                loading: 'Analyzing digital footprints...<br>Following the trail',
                noResults: 'Case closed: No matches for "$QUERY"<br>Perhaps try a different angle?',
                evidenceUnknown: 'Unknown Evidence',
                
                // 자동완성
                recentSearches: '🕐 Recent Cases',
                
                // 설정
                settings: 'Settings',
                language: 'Language',
                theme: 'Theme',
                darkMode: 'Dark Mode',
                lightMode: 'Light Mode',
                korean: '한국어',
                english: 'English'
            }
        };
    }

    // 현재 언어 가져오기
    getCurrentLang() {
        return this.currentLang;
    }

    // 언어 설정
    setLang(lang) {
        this.currentLang = lang;
        localStorage.setItem('language', lang);
        this.updateUI();
        
        // 검색 버튼 이벤트 리스너 재설정 (innerHTML 변경으로 인한 손실 방지)
        setTimeout(() => {
            const searchBtn = document.getElementById('searchBtn');
            if (searchBtn && window.setupEventListeners) {
                // 기존 리스너 제거하고 새로 설정
                const newBtn = searchBtn.cloneNode(true);
                searchBtn.parentNode.replaceChild(newBtn, searchBtn);
                window.setupEventListeners();
            }
        }, 50);
    }

    // 번역 텍스트 가져오기
    t(key, replacements = {}) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                console.warn(`Translation key not found: ${key}`);
                return key;
            }
        }
        
        if (typeof value === 'string') {
            // 치환 패턴 적용
            Object.entries(replacements).forEach(([placeholder, replacement]) => {
                value = value.replace(new RegExp(`\\$${placeholder}`, 'g'), replacement);
            });
        }
        
        return value;
    }

    // 랜덤 빈 상태 메시지 가져오기
    getRandomEmptyState() {
        const emptyStates = this.t('emptyStates');
        return emptyStates[Math.floor(Math.random() * emptyStates.length)];
    }

    // UI 업데이트
    updateUI() {
        // 제목 업데이트
        const title = document.querySelector('h1');
        if (title) {
            title.textContent = `🕵️‍♂️ ${this.t('title')} 🔍`;
        }

        // 부제 업데이트
        const subtitle = document.querySelector('.detective-badge');
        if (subtitle) {
            subtitle.textContent = this.t('subtitle');
        }

        // 검색 placeholder 업데이트
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.placeholder = this.t('searchPlaceholder');
        }

        // 검색 버튼 업데이트
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            // 기존 구조 유지하면서 텍스트만 변경
            const magnifier = searchBtn.querySelector('.magnifier');
            if (magnifier) {
                // 기존 magnifier 아이콘 유지하고 텍스트만 교체
                searchBtn.innerHTML = `<span class="magnifier">🔍</span>${this.t('searchButton')}`;
            } else {
                // magnifier가 없으면 새로 생성
                searchBtn.innerHTML = `<span class="magnifier">🔍</span>${this.t('searchButton')}`;
            }
        }

        // 현재 표시된 내용이 빈 상태라면 업데이트
        const resultsContainer = document.getElementById('results');
        if (resultsContainer && resultsContainer.querySelector('.empty-state')) {
            const randomMessage = this.getRandomEmptyState();
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="case-folder">${randomMessage.icon}</div>
                    <p>${randomMessage.text}</p>
                </div>
            `;
        }

        // manifest의 제목도 업데이트 (동적으로는 불가능하지만 참고용)
        document.title = this.t('title');
    }

    // 한영 키워드 매핑 (언어별)
    getKeywordMapping() {
        if (this.currentLang === 'ko') {
            return {
                '케이스': 'case', '파일': 'file', '데이터': 'data', '리스트': 'list',
                '테스트': 'test', '디자인': 'design', '코드': 'code', '개발': 'dev',
                '프로젝트': 'project', '문서': 'docs', '튜토리얼': 'tutorial',
                '가이드': 'guide', '블로그': 'blog', '뉴스': 'news', '검색': 'search'
            };
        } else {
            return {
                'case': '케이스', 'file': '파일', 'data': '데이터', 'list': '리스트',
                'test': '테스트', 'design': '디자인', 'code': '코드', 'dev': '개발',
                'project': '프로젝트', 'docs': '문서', 'tutorial': '튜토리얼',
                'guide': '가이드', 'blog': '블로그', 'news': '뉴스', 'search': '검색'
            };
        }
    }
}

// 전역 인스턴스 생성
window.i18n = new I18n();