// ===== Knowledge Nexus — Main Application Script =====

// ===== DATA: Concepts =====
const concepts = [
  {
    id: 'cs', name: '컴퓨터과학', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학',
    summary: '계산, 정보, 자동화의 이론과 실제를 연구하는 학문',
    description: '컴퓨터과학은 알고리즘적 프로세스의 이론적 기초, 하드웨어 및 소프트웨어의 설계, 그리고 정보의 표현·처리·전달을 연구하는 학문입니다. 수학적 논리에 뿌리를 두며, 현대 사회의 거의 모든 분야에 영향을 미칩니다.',
    difficulty: 1, prerequisites: [],
    examples: ['운영체제 설계', '웹 애플리케이션 개발', '데이터 분석'],
    history: '1936년 앨런 튜링의 튜링머신 개념이 컴퓨터과학의 이론적 토대를 마련했습니다.',
    realWorldConnection: '스마트폰, 인터넷, AI 비서 등 일상의 거의 모든 기술이 컴퓨터과학에 기반합니다.',
  },
  {
    id: 'algorithms', name: '알고리즘', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.알고리즘',
    summary: '문제를 해결하기 위한 명확하고 유한한 절차',
    description: '알고리즘은 주어진 입력을 원하는 출력으로 변환하는 유한한 단계의 명확한 절차입니다. 효율성(시간 복잡도, 공간 복잡도)이 핵심 평가 기준이며, 동일한 문제를 다양한 전략으로 풀 수 있습니다.',
    difficulty: 2, prerequisites: ['cs'],
    examples: ['정렬 알고리즘(퀵소트, 머지소트)', '그래프 탐색(BFS, DFS)', '동적 프로그래밍'],
    history: '9세기 페르시아 수학자 알-콰리즈미의 이름에서 유래했습니다.',
    realWorldConnection: '검색 엔진의 페이지 랭킹, 네비게이션의 최단 경로 계산 등에 활용됩니다.',
  },
  {
    id: 'data-structures', name: '자료구조', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.자료구조',
    summary: '데이터를 효율적으로 저장하고 접근하기 위한 조직 방식',
    description: '자료구조는 데이터를 메모리에 배치하고 관리하는 방법을 정의합니다. 적절한 자료구조의 선택은 알고리즘의 효율성에 직접적인 영향을 미칩니다. 배열, 연결 리스트, 트리, 그래프, 해시 테이블 등이 기본적인 자료구조입니다.',
    difficulty: 2, prerequisites: ['cs'],
    examples: ['배열과 연결 리스트', '이진 탐색 트리', '해시 맵'],
    realWorldConnection: '데이터베이스의 인덱싱, 파일 시스템의 디렉토리 구조 등이 자료구조의 응용입니다.',
  },
  {
    id: 'sorting', name: '정렬 알고리즘', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.알고리즘.정렬',
    summary: '데이터를 특정 순서로 배치하는 알고리즘',
    description: '정렬은 데이터 원소들을 일정한 순서(오름차순, 내림차순 등)로 재배치하는 작업입니다. O(n²) 알고리즘(버블, 삽입, 선택)과 O(n log n) 알고리즘(퀵소트, 머지소트, 힙소트)으로 나뉩니다.',
    difficulty: 2, prerequisites: ['algorithms', 'data-structures'],
    examples: ['퀵소트: 피벗을 기준으로 분할', '머지소트: 분할 정복으로 합병', '힙소트: 힙 자료구조 활용'],
    realWorldConnection: '데이터베이스 쿼리 결과 정렬, 파일 탐색기의 이름순/날짜순 정렬에 사용됩니다.',
  },
  {
    id: 'graph-algo', name: '그래프 알고리즘', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.알고리즘.그래프알고리즘',
    summary: '그래프 구조에서 탐색, 경로, 연결성을 분석하는 알고리즘',
    description: '그래프 알고리즘은 정점(노드)과 간선(엣지)으로 구성된 그래프 위에서 동작합니다. BFS/DFS 탐색, 최단 경로(다익스트라, 벨만-포드), 최소 신장 트리(크루스칼, 프림), 위상 정렬 등이 포함됩니다.',
    difficulty: 3, prerequisites: ['algorithms', 'data-structures'],
    examples: ['BFS: 너비 우선 탐색', 'DFS: 깊이 우선 탐색', '다익스트라: 가중 최단 경로'],
    realWorldConnection: '소셜 네트워크 분석, 지도 네비게이션, 네트워크 라우팅에 활용됩니다.',
  },
  {
    id: 'dynamic-programming', name: '동적 프로그래밍', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.알고리즘.동적프로그래밍',
    summary: '부분 문제의 해를 저장하여 중복 계산을 피하는 최적화 기법',
    description: '동적 프로그래밍(DP)은 문제를 겹치는 부분 문제로 분해하고, 각 부분 문제의 해를 메모이제이션하여 전체 문제를 효율적으로 푸는 기법입니다. 최적 부분 구조와 중복 부분 문제라는 두 조건이 필요합니다.',
    difficulty: 4, prerequisites: ['algorithms'],
    examples: ['피보나치 수열 계산', '배낭 문제(Knapsack)', '최장 공통 부분 수열(LCS)'],
    realWorldConnection: '경로 최적화, 자원 배분, 유전자 서열 분석에 활용됩니다.',
  },
  {
    id: 'ai', name: '인공지능', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.인공지능',
    summary: '인간의 지능적 행동을 기계로 구현하는 연구 분야',
    description: '인공지능(AI)은 학습, 추론, 인식, 언어 이해 등 인간의 지적 능력을 컴퓨터로 구현하는 분야입니다. 탐색, 지식 표현, 기계 학습, 자연어 처리, 컴퓨터 비전 등의 하위 영역이 있습니다.',
    difficulty: 2, prerequisites: ['cs', 'algorithms'],
    examples: ['자율주행 자동차', '음성 인식 비서(Siri, Alexa)', 'AlphaGo'],
    history: '1956년 다트머스 회의에서 존 매카시가 "인공지능"이라는 용어를 처음 사용했습니다.',
    realWorldConnection: '추천 시스템, 의료 진단 보조, 자동 번역 등 일상 곳곳에 침투해 있습니다.',
  },
  {
    id: 'ml', name: '머신러닝', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.인공지능.머신러닝',
    summary: '데이터에서 패턴을 학습하여 예측하는 AI의 핵심 방법론',
    description: '머신러닝은 명시적으로 프로그래밍하지 않고 데이터로부터 학습하는 시스템을 연구합니다. 지도학습(분류, 회귀), 비지도학습(클러스터링, 차원 축소), 강화학습의 세 패러다임으로 나뉩니다.',
    difficulty: 3, prerequisites: ['ai', 'statistics', 'linear-algebra'],
    examples: ['스팸 메일 필터링(분류)', '주가 예측(회귀)', '고객 세분화(클러스터링)'],
    realWorldConnection: '넷플릭스 추천, 신용 점수 산출, 의료 영상 분석에 사용됩니다.',
  },
  {
    id: 'deep-learning', name: '딥러닝', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.인공지능.머신러닝.딥러닝',
    summary: '다층 신경망을 사용하여 복잡한 패턴을 학습하는 방법',
    description: '딥러닝은 여러 층의 인공 신경망(Deep Neural Network)을 사용하여 데이터의 계층적 표현을 자동으로 학습합니다. CNN(이미지), RNN/Transformer(시퀀스), GAN(생성) 등의 아키텍처가 있습니다.',
    difficulty: 4, prerequisites: ['ml', 'neural-networks', 'linear-algebra'],
    examples: ['이미지 인식(ResNet)', '기계 번역(Transformer)', '이미지 생성(Stable Diffusion)'],
    history: '2012년 AlexNet이 ImageNet 대회에서 압도적 성능을 보이며 딥러닝 혁명이 시작되었습니다.',
    realWorldConnection: 'ChatGPT, 자율주행 시각 처리, 의료 영상 진단에 활용됩니다.',
  },
  {
    id: 'neural-networks', name: '인공 신경망', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.인공지능.머신러닝.신경망',
    summary: '생물학적 뉴런을 모방한 연산 모델',
    description: '인공 신경망은 뉴런(노드)과 시냅스(가중치 연결)로 구성됩니다. 입력층 → 은닉층 → 출력층 구조로 데이터를 처리하며, 역전파 알고리즘으로 학습합니다.',
    difficulty: 3, prerequisites: ['ml', 'linear-algebra'],
    examples: ['퍼셉트론(단층)', '다층 퍼셉트론(MLP)', '합성곱 신경망(CNN)'],
    history: '1943년 맥컬록-피츠 뉴런 모델에서 시작, 1986년 역전파 알고리즘으로 부활했습니다.',
    realWorldConnection: '이미지 분류, 음성 인식, 자연어 처리의 기반 기술입니다.',
  },
  {
    id: 'nlp', name: '자연어 처리', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.인공지능.자연어처리',
    summary: '컴퓨터가 인간 언어를 이해하고 생성하는 기술',
    description: '자연어 처리(NLP)는 텍스트와 음성 형태의 인간 언어를 컴퓨터로 분석, 이해, 생성하는 분야입니다. 형태소 분석, 구문 분석, 의미 분석, 감정 분석, 기계 번역 등이 주요 과제입니다.',
    difficulty: 3, prerequisites: ['ai', 'ml'],
    examples: ['기계 번역(구글 번역)', '챗봇(ChatGPT)', '감정 분석(리뷰 평가)'],
    realWorldConnection: '검색 엔진, 고객 서비스 봇, 자동 요약 서비스에 활용됩니다.',
  },
  {
    id: 'llm', name: '대규모 언어 모델', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.인공지능.자연어처리.LLM',
    summary: '대량의 텍스트로 학습된 초대형 생성 언어 모델',
    description: 'LLM(Large Language Model)은 수십억~수조 개의 파라미터를 가진 Transformer 기반 모델로, 인터넷 규모의 텍스트 데이터로 사전 학습됩니다. GPT, Claude, Llama 등이 대표적입니다.',
    difficulty: 4, prerequisites: ['nlp', 'deep-learning', 'transformer'],
    examples: ['GPT-4 (OpenAI)', 'Claude (Anthropic)', 'Llama (Meta)'],
    history: '2017년 Transformer 논문 이후, 2020년 GPT-3가 대규모 언어 모델 시대를 열었습니다.',
    realWorldConnection: '코드 생성, 창작 글쓰기, 지식 질의응답 등 범용 AI 도구로 사용됩니다.',
  },
  {
    id: 'transformer', name: 'Transformer', type: 'THEORY',
    taxonomyPath: '컴퓨터과학.인공지능.머신러닝.딥러닝.Transformer',
    summary: '자기 주의(Self-Attention) 메커니즘 기반의 시퀀스 처리 아키텍처',
    description: 'Transformer는 2017년 "Attention Is All You Need" 논문에서 제안된 아키텍처입니다. RNN 없이 Self-Attention만으로 시퀀스를 병렬 처리하여, 긴 의존성 학습과 학습 속도 모두를 혁신적으로 개선했습니다.',
    difficulty: 5, prerequisites: ['deep-learning', 'neural-networks'],
    examples: ['인코더-디코더 구조(원래 번역용)', 'BERT(인코더만)', 'GPT(디코더만)'],
    history: '2017년 구글 "Attention Is All You Need" 논문으로 발표되었습니다.',
    realWorldConnection: 'ChatGPT, 구글 검색, GitHub Copilot의 핵심 기반 기술입니다.',
  },
  {
    id: 'programming-languages', name: '프로그래밍 언어', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.프로그래밍언어',
    summary: '컴퓨터에게 명령을 전달하기 위한 형식 언어',
    description: '프로그래밍 언어는 알고리즘을 기계가 실행할 수 있는 형태로 표현하는 도구입니다. 패러다임(절차적, 객체지향, 함수형), 타입 시스템(정적/동적, 강/약), 추상화 수준(저수준/고수준)으로 분류됩니다.',
    difficulty: 2, prerequisites: ['cs'],
    examples: ['Python(범용, 고수준)', 'C(시스템, 저수준)', 'Haskell(함수형)'],
    realWorldConnection: '모든 소프트웨어는 프로그래밍 언어로 작성됩니다.',
  },
  {
    id: 'oop', name: '객체지향 프로그래밍', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.프로그래밍언어.객체지향',
    summary: '데이터와 행위를 객체로 묶어 모듈화하는 프로그래밍 패러다임',
    description: '객체지향 프로그래밍(OOP)은 캡슐화, 상속, 다형성, 추상화를 핵심 원칙으로 합니다. 현실 세계의 개체를 모델링하여 코드의 재사용성과 유지보수성을 높입니다.',
    difficulty: 2, prerequisites: ['programming-languages'],
    examples: ['Java의 클래스와 인터페이스', 'Python의 클래스 상속', 'C++의 가상 함수'],
    realWorldConnection: '대부분의 산업용 소프트웨어(게임, ERP, 웹 앱)가 OOP로 설계됩니다.',
  },
  {
    id: 'functional-programming', name: '함수형 프로그래밍', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.프로그래밍언어.함수형',
    summary: '순수 함수와 불변 데이터를 기반으로 하는 프로그래밍 패러다임',
    description: '함수형 프로그래밍(FP)은 부수 효과를 최소화하고, 함수를 일급 시민으로 다루며, 불변성을 강조합니다. 동시성 프로그래밍에서 장점이 있으며, 최근 대부분의 현대 언어가 FP 요소를 도입하고 있습니다.',
    difficulty: 3, prerequisites: ['programming-languages'],
    examples: ['Haskell의 모나드', 'JavaScript의 map/filter/reduce', 'Elixir의 패턴 매칭'],
    realWorldConnection: 'React의 상태 관리, 데이터 파이프라인, 금융 시스템에서 활용됩니다.',
  },
  {
    id: 'software-engineering', name: '소프트웨어 공학', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.소프트웨어공학',
    summary: '소프트웨어를 체계적으로 개발·유지·관리하는 공학적 접근',
    description: '소프트웨어 공학은 요구사항 분석, 설계, 구현, 테스팅, 유지보수의 전 과정을 다룹니다. 개발 방법론(애자일, 워터폴), 설계 패턴, 아키텍처, 품질 보증 등이 포함됩니다.',
    difficulty: 2, prerequisites: ['cs', 'programming-languages'],
    examples: ['애자일 스크럼 방법론', '마이크로서비스 아키텍처', 'CI/CD 파이프라인'],
    realWorldConnection: '대규모 팀이 복잡한 소프트웨어를 협업하여 개발하는 데 필수적입니다.',
  },
  {
    id: 'design-patterns', name: '디자인 패턴', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.소프트웨어공학.디자인패턴',
    summary: '소프트웨어 설계에서 반복적으로 등장하는 문제의 재사용 가능한 해결책',
    description: '디자인 패턴은 특정 맥락에서 공통으로 발생하는 문제에 대한 검증된 설계 템플릿입니다. 생성(Singleton, Factory), 구조(Adapter, Decorator), 행위(Observer, Strategy) 패턴으로 분류됩니다.',
    difficulty: 3, prerequisites: ['oop', 'software-engineering'],
    examples: ['Observer: 이벤트 기반 통신', 'Factory: 객체 생성 위임', 'Strategy: 알고리즘 교체'],
    history: '1994년 GoF(Gang of Four) 책에서 23개 패턴이 체계화되었습니다.',
    realWorldConnection: '프레임워크 설계(React의 Observer, Spring의 Factory)에 광범위하게 적용됩니다.',
  },
  {
    id: 'networks', name: '컴퓨터 네트워크', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.네트워크',
    summary: '컴퓨터 간 데이터 통신을 위한 시스템과 프로토콜',
    description: '컴퓨터 네트워크는 두 대 이상의 컴퓨터가 데이터를 교환하는 시스템입니다. OSI 7계층, TCP/IP 모델, 라우팅, HTTP, DNS 등의 프로토콜과 개념으로 구성됩니다.',
    difficulty: 2, prerequisites: ['cs'],
    examples: ['인터넷(TCP/IP 기반)', '로컬 네트워크(LAN)', '무선 네트워크(Wi-Fi)'],
    realWorldConnection: '인터넷, 클라우드 컴퓨팅, IoT의 기반 인프라입니다.',
  },
  {
    id: 'os', name: '운영체제', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.운영체제',
    summary: '하드웨어와 소프트웨어 사이를 중재하는 시스템 소프트웨어',
    description: '운영체제(OS)는 프로세스 관리, 메모리 관리, 파일 시스템, I/O 관리, 보안 등을 담당합니다. Windows, macOS, Linux가 대표적이며, 커널이 핵심 구성요소입니다.',
    difficulty: 3, prerequisites: ['cs', 'data-structures'],
    examples: ['Linux 커널', 'Windows NT', '안드로이드(리눅스 기반)'],
    realWorldConnection: '모든 컴퓨팅 장치(PC, 스마트폰, 서버)에서 필수적으로 동작합니다.',
  },
  {
    id: 'databases', name: '데이터베이스', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.데이터베이스',
    summary: '데이터를 체계적으로 저장·관리·검색하는 시스템',
    description: '데이터베이스는 구조화된 데이터의 집합과 이를 관리하는 시스템(DBMS)을 포함합니다. 관계형(SQL), 문서형(MongoDB), 그래프형(Neo4j), 키-값(Redis) 등 다양한 유형이 있습니다.',
    difficulty: 2, prerequisites: ['cs', 'data-structures'],
    examples: ['PostgreSQL(관계형)', 'MongoDB(문서형)', 'Neo4j(그래프형)'],
    realWorldConnection: '거의 모든 웹 서비스, 기업 시스템, 모바일 앱이 데이터베이스를 사용합니다.',
  },
  {
    id: 'discrete-math', name: '이산수학', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.수학적기초.이산수학',
    summary: '이산적(비연속적) 구조를 다루는 수학 분야',
    description: '이산수학은 정수, 그래프, 집합, 논리, 조합론 등 비연속적 구조를 연구합니다. 컴퓨터과학의 이론적 기반이며, 알고리즘 분석과 증명에 필수적입니다.',
    difficulty: 3, prerequisites: ['cs'],
    examples: ['그래프 이론', '조합론(경우의 수)', '수학적 귀납법'],
    realWorldConnection: '암호학, 네트워크 설계, 데이터베이스 쿼리 최적화에 활용됩니다.',
  },
  {
    id: 'linear-algebra', name: '선형대수', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.수학적기초.선형대수',
    summary: '벡터, 행렬, 선형 변환을 다루는 수학 분야',
    description: '선형대수는 벡터 공간과 선형 변환을 연구합니다. 행렬 연산, 고유값/고유벡터, 차원 축소 등이 핵심이며, 머신러닝과 컴퓨터 그래픽스에 필수적인 수학적 도구입니다.',
    difficulty: 3, prerequisites: ['discrete-math'],
    examples: ['행렬 곱셈', '주성분 분석(PCA)', '3D 회전 변환'],
    realWorldConnection: '3D 게임 그래픽스, 추천 시스템, 신경망 연산에 직접 사용됩니다.',
  },
  {
    id: 'statistics', name: '확률과 통계', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.수학적기초.확률통계',
    summary: '불확실성을 수학적으로 다루는 학문',
    description: '확률론은 무작위 현상을 모델링하고, 통계학은 데이터에서 결론을 도출합니다. 베이즈 정리, 확률 분포, 가설 검정, 회귀 분석 등이 머신러닝의 수학적 기반을 제공합니다.',
    difficulty: 3, prerequisites: ['discrete-math'],
    examples: ['베이즈 정리(조건부 확률)', '정규분포', 'A/B 테스트(가설 검정)'],
    realWorldConnection: '보험 산업, 임상 시험, 추천 알고리즘, 데이터 분석에 핵심입니다.',
  },
  {
    id: 'computation-theory', name: '계산 이론', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.수학적기초.계산이론',
    summary: '무엇이 계산 가능하고 얼마나 어려운지를 연구하는 분야',
    description: '계산 이론은 오토마타 이론, 계산 가능성, 계산 복잡도를 다룹니다. "이 문제를 풀 수 있는가?"(결정 가능성)와 "얼마나 빨리 풀 수 있는가?"(P vs NP) 같은 근본적 질문을 탐구합니다.',
    difficulty: 4, prerequisites: ['discrete-math', 'algorithms'],
    examples: ['튜링머신', 'P vs NP 문제', '정지 문제(Halting Problem)'],
    history: '1936년 튜링의 튜링머신과 처치의 람다 대수가 기원입니다.',
    realWorldConnection: '암호학의 보안 기반(NP-hard 문제), 컴파일러 설계에 근본적 영향을 미칩니다.',
  },
  {
    id: 'security', name: '정보보안', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.보안',
    summary: '정보의 기밀성, 무결성, 가용성을 보호하는 분야',
    description: '정보보안은 암호학, 네트워크 보안, 시스템 보안, 애플리케이션 보안을 포괄합니다. 위협 모델링, 취약점 분석, 방어 메커니즘 설계가 주요 활동입니다.',
    difficulty: 3, prerequisites: ['cs', 'networks'],
    examples: ['암호화(AES, RSA)', '인증 시스템(OAuth)', '방화벽'],
    realWorldConnection: '온라인 뱅킹, 전자상거래, 개인정보 보호에 필수적입니다.',
  },
  {
    id: 'cryptography', name: '암호학', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.보안.암호학',
    summary: '수학적 기법으로 정보를 안전하게 보호하는 학문',
    description: '암호학은 대칭키(AES), 비대칭키(RSA, ECC), 해시 함수(SHA), 디지털 서명을 통해 통신의 기밀성과 무결성을 보장합니다. 현대 암호학은 수론과 계산 복잡도에 기반합니다.',
    difficulty: 4, prerequisites: ['security', 'discrete-math', 'computation-theory'],
    examples: ['HTTPS의 TLS 프로토콜', '비트코인의 SHA-256', 'RSA 공개키 암호'],
    realWorldConnection: '모든 인터넷 통신(HTTPS), 블록체인, 전자서명에 사용됩니다.',
  },
  {
    id: 'web-development', name: '웹 개발', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.소프트웨어공학.웹개발',
    summary: '웹 브라우저에서 동작하는 애플리케이션을 만드는 분야',
    description: '웹 개발은 프론트엔드(HTML, CSS, JavaScript, React), 백엔드(서버, API, DB), 인프라(배포, CDN)로 나뉩니다. HTTP 프로토콜 위에서 동작하며, 현대 소프트웨어의 주요 배포 형태입니다.',
    difficulty: 2, prerequisites: ['programming-languages', 'networks'],
    examples: ['React SPA 개발', 'REST API 설계', 'Next.js 풀스택 앱'],
    realWorldConnection: '우리가 매일 사용하는 거의 모든 서비스(구글, 유튜브, 넷플릭스)가 웹 기술로 구축됩니다.',
  },
  {
    id: 'turing', name: '앨런 튜링', type: 'PERSON',
    taxonomyPath: '컴퓨터과학.인물.앨런튜링',
    summary: '현대 컴퓨터과학과 인공지능의 아버지',
    description: '앨런 튜링(1912-1954)은 튜링머신 개념으로 계산 이론의 기초를 놓았고, 2차 대전 중 에니그마 암호를 해독했으며, 튜링 테스트로 AI의 철학적 기반을 제시했습니다.',
    difficulty: 1, prerequisites: [],
    examples: ['튜링머신(1936)', '에니그마 해독(1940s)', '튜링 테스트(1950)'],
    history: '1912년 런던 출생, 1954년 사망. 2013년 영국 정부 공식 사면.',
    realWorldConnection: '컴퓨터과학 최고 영예인 "튜링상"에 그의 이름이 붙어있습니다.',
  },
  {
    id: 'dijkstra', name: '에츠허르 다익스트라', type: 'PERSON',
    taxonomyPath: '컴퓨터과학.인물.다익스트라',
    summary: '구조적 프로그래밍과 그래프 알고리즘의 선구자',
    description: '다익스트라(1930-2002)는 최단 경로 알고리즘, 세마포어(동시성), "goto문 유해" 논문으로 유명합니다. 소프트웨어 공학의 수학적 엄밀성을 주장한 선구자입니다.',
    difficulty: 2, prerequisites: [],
    examples: ['다익스트라 알고리즘(1956)', '세마포어 개념', '"Go To Statement Considered Harmful"(1968)'],
    realWorldConnection: '모든 지도 앱의 길찾기가 그의 알고리즘 변형을 사용합니다.',
  },
  {
    id: 'cloud-computing', name: '클라우드 컴퓨팅', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.시스템.클라우드',
    summary: '인터넷을 통해 컴퓨팅 자원을 탄력적으로 제공하는 모델',
    description: '클라우드 컴퓨팅은 IaaS(인프라), PaaS(플랫폼), SaaS(소프트웨어) 모델로 컴퓨팅 자원을 온디맨드 제공합니다. 가상화, 컨테이너, 서버리스 등의 기술에 기반합니다.',
    difficulty: 3, prerequisites: ['networks', 'os'],
    examples: ['AWS EC2(IaaS)', 'Heroku(PaaS)', 'Google Docs(SaaS)'],
    realWorldConnection: '대부분의 현대 서비스(넷플릭스, 에어비앤비 등)가 클라우드 위에서 운영됩니다.',
  },
  {
    id: 'blockchain', name: '블록체인', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.분산시스템.블록체인',
    summary: '분산 환경에서 신뢰를 만드는 불변 원장 기술',
    description: '블록체인은 암호학적 해시로 연결된 블록들의 분산 원장입니다. 합의 알고리즘(PoW, PoS)으로 중앙 기관 없이 거래를 검증합니다. 금융(DeFi), 디지털 자산(NFT), 공급망 추적 등에 응용됩니다.',
    difficulty: 4, prerequisites: ['cryptography', 'networks', 'data-structures'],
    examples: ['비트코인(최초의 블록체인)', '이더리움(스마트 컨트랙트)', 'NFT(디지털 소유권)'],
    history: '2008년 사토시 나카모토가 비트코인 백서를 발표하며 시작되었습니다.',
    realWorldConnection: '암호화폐, DeFi, 공급망 투명성, 디지털 신원 증명에 사용됩니다.',
  },
  {
    id: 'quantum-computing', name: '양자 컴퓨팅', type: 'CONCEPT',
    taxonomyPath: '컴퓨터과학.양자컴퓨팅',
    summary: '양자 역학 원리를 이용한 새로운 계산 패러다임',
    description: '양자 컴퓨팅은 큐비트의 중첩과 얽힘을 활용하여 특정 문제를 고전 컴퓨터보다 기하급수적으로 빠르게 풀 수 있습니다. 쇼어 알고리즘(소인수분해), 그로버 알고리즘(탐색) 등이 대표적입니다.',
    difficulty: 5, prerequisites: ['computation-theory', 'linear-algebra'],
    examples: ['쇼어 알고리즘(RSA 해독 위협)', '그로버 알고리즘(탐색 가속)', '양자 오류 정정'],
    realWorldConnection: '신약 개발(분자 시뮬레이션), 암호학 재설계, 최적화 문제에 잠재력이 있습니다.',
  },
];

// ===== DATA: Relations =====
const relations = [
  // Hierarchical
  { id: 'r1', sourceId: 'algorithms', targetId: 'cs', type: 'PART_OF', isHierarchical: true, weight: 1 },
  { id: 'r2', sourceId: 'data-structures', targetId: 'cs', type: 'PART_OF', isHierarchical: true, weight: 1 },
  { id: 'r3', sourceId: 'ai', targetId: 'cs', type: 'PART_OF', isHierarchical: true, weight: 1 },
  { id: 'r4', sourceId: 'ml', targetId: 'ai', type: 'IS_A', isHierarchical: true, weight: 1 },
  { id: 'r5', sourceId: 'deep-learning', targetId: 'ml', type: 'IS_A', isHierarchical: true, weight: 1 },
  { id: 'r6', sourceId: 'neural-networks', targetId: 'ml', type: 'PART_OF', isHierarchical: true, weight: 1 },
  { id: 'r7', sourceId: 'nlp', targetId: 'ai', type: 'PART_OF', isHierarchical: true, weight: 1 },
  { id: 'r8', sourceId: 'llm', targetId: 'nlp', type: 'IS_A', isHierarchical: true, weight: 1 },
  { id: 'r9', sourceId: 'transformer', targetId: 'deep-learning', type: 'PART_OF', isHierarchical: true, weight: 1 },
  { id: 'r10', sourceId: 'programming-languages', targetId: 'cs', type: 'PART_OF', isHierarchical: true, weight: 1 },
  { id: 'r11', sourceId: 'oop', targetId: 'programming-languages', type: 'IS_A', isHierarchical: true, weight: 1 },
  { id: 'r12', sourceId: 'functional-programming', targetId: 'programming-languages', type: 'IS_A', isHierarchical: true, weight: 1 },
  { id: 'r13', sourceId: 'software-engineering', targetId: 'cs', type: 'PART_OF', isHierarchical: true, weight: 1 },
  { id: 'r14', sourceId: 'design-patterns', targetId: 'software-engineering', type: 'PART_OF', isHierarchical: true, weight: 1 },
  { id: 'r15', sourceId: 'web-development', targetId: 'software-engineering', type: 'PART_OF', isHierarchical: true, weight: 1 },
  { id: 'r16', sourceId: 'networks', targetId: 'cs', type: 'PART_OF', isHierarchical: true, weight: 1 },
  { id: 'r17', sourceId: 'os', targetId: 'cs', type: 'PART_OF', isHierarchical: true, weight: 1 },
  { id: 'r18', sourceId: 'databases', targetId: 'cs', type: 'PART_OF', isHierarchical: true, weight: 1 },
  { id: 'r19', sourceId: 'security', targetId: 'cs', type: 'PART_OF', isHierarchical: true, weight: 1 },
  { id: 'r20', sourceId: 'cryptography', targetId: 'security', type: 'PART_OF', isHierarchical: true, weight: 1 },
  { id: 'r21', sourceId: 'sorting', targetId: 'algorithms', type: 'IS_A', isHierarchical: true, weight: 1 },
  { id: 'r22', sourceId: 'graph-algo', targetId: 'algorithms', type: 'IS_A', isHierarchical: true, weight: 1 },
  { id: 'r23', sourceId: 'dynamic-programming', targetId: 'algorithms', type: 'IS_A', isHierarchical: true, weight: 1 },
  { id: 'r24', sourceId: 'discrete-math', targetId: 'cs', type: 'PART_OF', isHierarchical: true, weight: 1 },
  { id: 'r25', sourceId: 'linear-algebra', targetId: 'cs', type: 'PART_OF', isHierarchical: true, weight: 1 },
  { id: 'r26', sourceId: 'statistics', targetId: 'cs', type: 'PART_OF', isHierarchical: true, weight: 1 },
  { id: 'r27', sourceId: 'computation-theory', targetId: 'cs', type: 'PART_OF', isHierarchical: true, weight: 1 },
  { id: 'r28', sourceId: 'cloud-computing', targetId: 'cs', type: 'PART_OF', isHierarchical: true, weight: 1 },
  { id: 'r29', sourceId: 'blockchain', targetId: 'cs', type: 'PART_OF', isHierarchical: true, weight: 1 },
  { id: 'r30', sourceId: 'quantum-computing', targetId: 'cs', type: 'PART_OF', isHierarchical: true, weight: 1 },
  // Cross-cutting: REQUIRES
  { id: 'r31', sourceId: 'ml', targetId: 'linear-algebra', type: 'REQUIRES', isHierarchical: false, weight: 0.9, description: '행렬 연산이 신경망의 핵심' },
  { id: 'r32', sourceId: 'ml', targetId: 'statistics', type: 'REQUIRES', isHierarchical: false, weight: 0.9, description: '확률/통계가 학습 이론의 기반' },
  { id: 'r33', sourceId: 'deep-learning', targetId: 'linear-algebra', type: 'REQUIRES', isHierarchical: false, weight: 0.95, description: '텐서 연산이 딥러닝의 기본 도구' },
  { id: 'r34', sourceId: 'cryptography', targetId: 'discrete-math', type: 'REQUIRES', isHierarchical: false, weight: 0.8, description: '수론과 그룹론이 암호학의 수학적 기반' },
  { id: 'r35', sourceId: 'cryptography', targetId: 'computation-theory', type: 'REQUIRES', isHierarchical: false, weight: 0.7, description: '계산 복잡도가 암호의 안전성 보장' },
  { id: 'r36', sourceId: 'graph-algo', targetId: 'discrete-math', type: 'REQUIRES', isHierarchical: false, weight: 0.8, description: '그래프 이론이 이산수학에서 유래' },
  { id: 'r37', sourceId: 'quantum-computing', targetId: 'linear-algebra', type: 'REQUIRES', isHierarchical: false, weight: 0.95, description: '큐비트 상태가 벡터 공간에서 표현됨' },
  { id: 'r38', sourceId: 'web-development', targetId: 'networks', type: 'REQUIRES', isHierarchical: false, weight: 0.7, description: 'HTTP/TCP 이해가 웹 개발에 필요' },
  { id: 'r39', sourceId: 'cloud-computing', targetId: 'networks', type: 'REQUIRES', isHierarchical: false, weight: 0.8, description: '분산 시스템은 네트워크 위에서 동작' },
  { id: 'r40', sourceId: 'cloud-computing', targetId: 'os', type: 'REQUIRES', isHierarchical: false, weight: 0.7, description: '가상화/컨테이너가 OS 개념에 기반' },
  { id: 'r41', sourceId: 'blockchain', targetId: 'cryptography', type: 'REQUIRES', isHierarchical: false, weight: 0.9, description: '해시/서명이 블록체인의 핵심 보안 기반' },
  { id: 'r42', sourceId: 'design-patterns', targetId: 'oop', type: 'REQUIRES', isHierarchical: false, weight: 0.8, description: '대부분의 GoF 패턴이 OOP에 기반' },
  { id: 'r43', sourceId: 'llm', targetId: 'transformer', type: 'REQUIRES', isHierarchical: false, weight: 0.95, description: 'LLM은 Transformer 아키텍처 위에 구축됨' },
  { id: 'r44', sourceId: 'llm', targetId: 'deep-learning', type: 'REQUIRES', isHierarchical: false, weight: 0.9, description: '대규모 신경망 학습 기법 필요' },
  // Cross-cutting: RELATES_TO / OPPOSES / CAUSES / CREATED_BY
  { id: 'r45', sourceId: 'algorithms', targetId: 'data-structures', type: 'RELATES_TO', isHierarchical: false, weight: 0.9, description: '알고리즘과 자료구조는 상호 의존적' },
  { id: 'r46', sourceId: 'oop', targetId: 'functional-programming', type: 'OPPOSES', isHierarchical: false, weight: 0.5, description: '상태 변경 vs 불변성이라는 대조적 접근' },
  { id: 'r47', sourceId: 'neural-networks', targetId: 'statistics', type: 'RELATES_TO', isHierarchical: false, weight: 0.6, description: '활성함수와 손실함수가 통계적 기반' },
  { id: 'r48', sourceId: 'quantum-computing', targetId: 'cryptography', type: 'OPPOSES', isHierarchical: false, weight: 0.7, description: '양자 컴퓨터가 현재 암호 체계를 위협' },
  { id: 'r49', sourceId: 'databases', targetId: 'data-structures', type: 'RELATES_TO', isHierarchical: false, weight: 0.7, description: 'B-트리, 해시 인덱스 등 자료구조를 활용' },
  { id: 'r50', sourceId: 'sorting', targetId: 'data-structures', type: 'REQUIRES', isHierarchical: false, weight: 0.6, description: '정렬은 배열/트리 등 자료구조 위에서 동작' },
  { id: 'r51', sourceId: 'computation-theory', targetId: 'turing', type: 'CREATED_BY', isHierarchical: false, weight: 0.9, description: '튜링머신이 계산 이론을 확립' },
  { id: 'r52', sourceId: 'graph-algo', targetId: 'dijkstra', type: 'CREATED_BY', isHierarchical: false, weight: 0.7, description: '다익스트라 알고리즘으로 분야 발전' },
  { id: 'r53', sourceId: 'deep-learning', targetId: 'llm', type: 'CAUSES', isHierarchical: false, weight: 0.8, description: '딥러닝의 발전이 LLM 탄생을 가능하게 함' },
  { id: 'r54', sourceId: 'cloud-computing', targetId: 'deep-learning', type: 'CAUSES', isHierarchical: false, weight: 0.6, description: '대규모 GPU 클러스터가 딥러닝 학습을 가속' },
];

// ===== DATA: Taxonomy Tree =====
const taxonomy = {
  id: 'root', name: '세계 지식', children: [
    { id: 'cs-tree', name: '컴퓨터과학', conceptId: 'cs', children: [
      { id: 'algo-tree', name: '알고리즘', conceptId: 'algorithms', children: [
        { id: 'sorting-tree', name: '정렬 알고리즘', conceptId: 'sorting', children: [] },
        { id: 'graph-algo-tree', name: '그래프 알고리즘', conceptId: 'graph-algo', children: [] },
        { id: 'dp-tree', name: '동적 프로그래밍', conceptId: 'dynamic-programming', children: [] },
      ]},
      { id: 'ds-tree', name: '자료구조', conceptId: 'data-structures', children: [] },
      { id: 'ai-tree', name: '인공지능', conceptId: 'ai', children: [
        { id: 'ml-tree', name: '머신러닝', conceptId: 'ml', children: [
          { id: 'dl-tree', name: '딥러닝', conceptId: 'deep-learning', children: [
            { id: 'transformer-tree', name: 'Transformer', conceptId: 'transformer', children: [] },
          ]},
          { id: 'nn-tree', name: '인공 신경망', conceptId: 'neural-networks', children: [] },
        ]},
        { id: 'nlp-tree', name: '자연어 처리', conceptId: 'nlp', children: [
          { id: 'llm-tree', name: '대규모 언어 모델', conceptId: 'llm', children: [] },
        ]},
      ]},
      { id: 'pl-tree', name: '프로그래밍 언어', conceptId: 'programming-languages', children: [
        { id: 'oop-tree', name: '객체지향 프로그래밍', conceptId: 'oop', children: [] },
        { id: 'fp-tree', name: '함수형 프로그래밍', conceptId: 'functional-programming', children: [] },
      ]},
      { id: 'se-tree', name: '소프트웨어 공학', conceptId: 'software-engineering', children: [
        { id: 'dp-pattern-tree', name: '디자인 패턴', conceptId: 'design-patterns', children: [] },
        { id: 'web-tree', name: '웹 개발', conceptId: 'web-development', children: [] },
      ]},
      { id: 'net-tree', name: '컴퓨터 네트워크', conceptId: 'networks', children: [] },
      { id: 'os-tree', name: '운영체제', conceptId: 'os', children: [] },
      { id: 'db-tree', name: '데이터베이스', conceptId: 'databases', children: [] },
      { id: 'sec-tree', name: '보안', conceptId: 'security', children: [
        { id: 'crypto-tree', name: '암호학', conceptId: 'cryptography', children: [] },
      ]},
      { id: 'math-tree', name: '수학적 기초', children: [
        { id: 'dm-tree', name: '이산수학', conceptId: 'discrete-math', children: [] },
        { id: 'la-tree', name: '선형대수', conceptId: 'linear-algebra', children: [] },
        { id: 'stat-tree', name: '확률과 통계', conceptId: 'statistics', children: [] },
        { id: 'ct-tree', name: '계산 이론', conceptId: 'computation-theory', children: [] },
      ]},
      { id: 'cloud-tree', name: '클라우드 컴퓨팅', conceptId: 'cloud-computing', children: [] },
      { id: 'bc-tree', name: '블록체인', conceptId: 'blockchain', children: [] },
      { id: 'qc-tree', name: '양자 컴퓨팅', conceptId: 'quantum-computing', children: [] },
      { id: 'people-tree', name: '주요 인물', children: [
        { id: 'turing-tree', name: '앨런 튜링', conceptId: 'turing', children: [] },
        { id: 'dijkstra-tree', name: '에츠허르 다익스트라', conceptId: 'dijkstra', children: [] },
      ]},
    ]},
  ],
};

// ===== DATA: Learning Paths =====
const learningPaths = [
  {
    id: 'path-llm', title: 'LLM(대규모 언어 모델) 이해하기',
    goal: 'ChatGPT 같은 대규모 언어 모델의 원리를 기초부터 이해한다',
    steps: [
      { conceptId: 'cs', order: 1, estimatedMinutes: 15 },
      { conceptId: 'algorithms', order: 2, estimatedMinutes: 30 },
      { conceptId: 'linear-algebra', order: 3, estimatedMinutes: 45 },
      { conceptId: 'statistics', order: 4, estimatedMinutes: 45 },
      { conceptId: 'ai', order: 5, estimatedMinutes: 20 },
      { conceptId: 'ml', order: 6, estimatedMinutes: 40 },
      { conceptId: 'neural-networks', order: 7, estimatedMinutes: 40 },
      { conceptId: 'deep-learning', order: 8, estimatedMinutes: 50 },
      { conceptId: 'transformer', order: 9, estimatedMinutes: 60 },
      { conceptId: 'nlp', order: 10, estimatedMinutes: 30 },
      { conceptId: 'llm', order: 11, estimatedMinutes: 40 },
    ],
  },
  {
    id: 'path-blockchain', title: '블록체인 기술 마스터',
    goal: '블록체인의 기술적 기반을 암호학부터 체계적으로 이해한다',
    steps: [
      { conceptId: 'cs', order: 1, estimatedMinutes: 15 },
      { conceptId: 'data-structures', order: 2, estimatedMinutes: 30 },
      { conceptId: 'networks', order: 3, estimatedMinutes: 30 },
      { conceptId: 'discrete-math', order: 4, estimatedMinutes: 40 },
      { conceptId: 'security', order: 5, estimatedMinutes: 25 },
      { conceptId: 'cryptography', order: 6, estimatedMinutes: 50 },
      { conceptId: 'blockchain', order: 7, estimatedMinutes: 45 },
    ],
  },
  {
    id: 'path-web', title: '웹 개발자 되기',
    goal: '웹 개발에 필요한 기초 지식을 체계적으로 쌓는다',
    steps: [
      { conceptId: 'cs', order: 1, estimatedMinutes: 15 },
      { conceptId: 'programming-languages', order: 2, estimatedMinutes: 25 },
      { conceptId: 'data-structures', order: 3, estimatedMinutes: 30 },
      { conceptId: 'oop', order: 4, estimatedMinutes: 30 },
      { conceptId: 'networks', order: 5, estimatedMinutes: 30 },
      { conceptId: 'databases', order: 6, estimatedMinutes: 35 },
      { conceptId: 'software-engineering', order: 7, estimatedMinutes: 25 },
      { conceptId: 'design-patterns', order: 8, estimatedMinutes: 40 },
      { conceptId: 'web-development', order: 9, estimatedMinutes: 45 },
    ],
  },
];

// ===== CONSTANTS =====
const RELATION_LABELS = {
  IS_A: '~의 일종', PART_OF: '구성요소', CAUSES: '야기함',
  REQUIRES: '필요로 함', OPPOSES: '대립', RELATES_TO: '관련',
  CREATED_BY: '창시', PRECEDED_BY: '선행',
};

const RELATION_COLORS = {
  IS_A: '#6366f1', PART_OF: '#8b5cf6', CAUSES: '#ef4444',
  REQUIRES: '#f59e0b', OPPOSES: '#ec4899', RELATES_TO: '#6b7280',
  CREATED_BY: '#10b981', PRECEDED_BY: '#06b6d4',
};

const TYPE_LABELS = { CONCEPT: '개념', PERSON: '인물', EVENT: '사건', THEORY: '이론', ARTIFACT: '산출물' };
const DIFFICULTY_LABELS = ['입문', '기초', '중급', '고급', '전문가'];

// ===== APP STATE =====
const state = {
  mode: 'structure',
  selectedConceptId: 'cs',
  expandedNodes: new Set(['root', 'cs-tree']),
  selectedPathId: null,
  completedSteps: new Set(),
  cyMini: null,
  cyFull: null,
};

// ===== HELPERS =====
function getConceptById(id) {
  return concepts.find(c => c.id === id);
}

function getRelationsForConcept(id) {
  return relations.filter(r => r.sourceId === id || r.targetId === id);
}

// ===== MODE SWITCHING =====
function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `view-${mode}`);
  });
  if (mode === 'explore') {
    setTimeout(() => renderFullGraph(), 50);
  }
  if (mode === 'learn') {
    renderLearnView();
  }
}

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

// ===== TREE VIEW =====
function renderTree() {
  const container = document.getElementById('tree-container');
  container.innerHTML = '';
  taxonomy.children.forEach(node => {
    container.appendChild(createTreeNode(node, 0));
  });
}

function createTreeNode(node, depth) {
  const div = document.createElement('div');
  div.className = 'tree-node';

  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = state.expandedNodes.has(node.id);
  const isSelected = node.conceptId === state.selectedConceptId;
  const concept = node.conceptId ? getConceptById(node.conceptId) : null;

  // Row
  const row = document.createElement('div');
  row.className = 'tree-node-row' + (isSelected ? ' selected' : '');
  row.style.paddingLeft = (depth * 16 + 8) + 'px';

  // Arrow
  const arrow = document.createElement('span');
  arrow.className = 'tree-arrow' + (isExpanded ? ' expanded' : '') + (!hasChildren ? ' leaf' : '');
  arrow.textContent = hasChildren ? '▶' : '•';
  row.appendChild(arrow);

  // Icon
  const icon = document.createElement('span');
  icon.className = 'tree-icon';
  if (concept && concept.type === 'PERSON') icon.textContent = '👤';
  else if (hasChildren) icon.textContent = '📁';
  else icon.textContent = '📄';
  row.appendChild(icon);

  // Name
  const name = document.createElement('span');
  name.className = 'tree-name';
  name.textContent = node.name;
  row.appendChild(name);

  // Difficulty dots
  if (concept) {
    const dots = document.createElement('span');
    dots.className = 'tree-difficulty';
    for (let i = 0; i < 5; i++) {
      const dot = document.createElement('span');
      dot.className = 'dot' + (i < concept.difficulty ? ' active' : '');
      dots.appendChild(dot);
    }
    row.appendChild(dots);
  }

  // Click handler
  row.addEventListener('click', () => {
    if (hasChildren) {
      if (state.expandedNodes.has(node.id)) {
        state.expandedNodes.delete(node.id);
      } else {
        state.expandedNodes.add(node.id);
      }
    }
    if (node.conceptId) {
      state.selectedConceptId = node.conceptId;
      renderDocument();
      renderMiniGraph();
    }
    renderTree();
  });

  div.appendChild(row);

  // Children
  if (hasChildren) {
    const childrenDiv = document.createElement('div');
    childrenDiv.className = 'tree-children' + (isExpanded ? ' expanded' : '');
    node.children.forEach(child => {
      childrenDiv.appendChild(createTreeNode(child, depth + 1));
    });
    div.appendChild(childrenDiv);
  }

  return div;
}

// ===== DOCUMENT VIEW =====
function renderDocument() {
  const container = document.getElementById('concept-document');
  const concept = getConceptById(state.selectedConceptId);

  if (!concept) {
    container.innerHTML = `<div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
      <p class="empty-title">개념을 선택해주세요</p>
      <p class="empty-desc">왼쪽 트리에서 개념을 클릭하면 여기에 표시됩니다</p>
    </div>`;
    return;
  }

  const rels = getRelationsForConcept(concept.id).filter(r => !r.isHierarchical);
  const prereqs = concept.prerequisites.map(id => getConceptById(id)).filter(Boolean);

  let html = `
    <div class="doc-header">
      <div class="doc-badges">
        <span class="badge badge-type">${TYPE_LABELS[concept.type] || concept.type}</span>
        <span class="badge badge-difficulty">난이도: ${DIFFICULTY_LABELS[concept.difficulty - 1]}</span>
        <span class="difficulty-dots">${Array.from({length: 5}, (_, i) =>
          `<span class="dot${i < concept.difficulty ? ' active' : ''}"></span>`
        ).join('')}</span>
      </div>
      <h1 class="doc-title">${concept.name}</h1>
      <p class="doc-path">📍 ${concept.taxonomyPath.split('.').join(' › ')}</p>
    </div>

    <div class="doc-summary"><p>"${concept.summary}"</p></div>

    <div class="doc-section">
      <h2 class="doc-section-title"><span class="icon">📖</span> 핵심 설명</h2>
      <p>${concept.description}</p>
    </div>
  `;

  if (prereqs.length > 0) {
    html += `<div class="doc-section">
      <h2 class="doc-section-title"><span class="icon">🔗</span> 선행 지식</h2>
      <div class="prereq-list">
        ${prereqs.map(p => `<button class="prereq-btn" data-id="${p.id}">→ ${p.name}</button>`).join('')}
      </div>
    </div>`;
  }

  if (concept.examples.length > 0) {
    html += `<div class="doc-section">
      <h2 class="doc-section-title"><span class="icon">⚡</span> 구체적 예시</h2>
      <ul class="example-list">
        ${concept.examples.map((ex, i) => `<li><span class="example-num">${i + 1}</span>${ex}</li>`).join('')}
      </ul>
    </div>`;
  }

  if (concept.history) {
    html += `<div class="doc-section">
      <h2 class="doc-section-title"><span class="icon">🕐</span> 역사적 맥락</h2>
      <p>${concept.history}</p>
    </div>`;
  }

  if (concept.realWorldConnection) {
    html += `<div class="doc-section">
      <h2 class="doc-section-title"><span class="icon">🌍</span> 실생활 연결</h2>
      <p>${concept.realWorldConnection}</p>
    </div>`;
  }

  if (rels.length > 0) {
    html += `<div class="doc-section">
      <h2 class="doc-section-title"><span class="icon">🕸️</span> 연결된 개념</h2>
      <div class="relation-list">
        ${rels.map(r => {
          const otherId = r.sourceId === concept.id ? r.targetId : r.sourceId;
          const other = getConceptById(otherId);
          if (!other) return '';
          const dir = r.sourceId === concept.id ? '→' : '←';
          const color = RELATION_COLORS[r.type];
          return `<button class="relation-item" data-id="${otherId}">
            <span class="relation-badge" style="background:${color}20;color:${color}">${RELATION_LABELS[r.type]}</span>
            <span class="relation-direction">${dir}</span>
            <span class="relation-name">${other.name}</span>
            ${r.description ? `<span class="relation-desc">${r.description}</span>` : ''}
          </button>`;
        }).join('')}
      </div>
    </div>`;
  }

  container.innerHTML = html;

  // Add click handlers for navigation
  container.querySelectorAll('.prereq-btn, .relation-item').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedConceptId = btn.dataset.id;
      renderDocument();
      renderMiniGraph();
      renderTree();
    });
  });
}

// ===== MINI GRAPH (Cytoscape.js) =====
function renderMiniGraph() {
  const container = document.getElementById('mini-graph-container');
  if (!state.selectedConceptId) return;

  const relatedRels = relations.filter(
    r => r.sourceId === state.selectedConceptId || r.targetId === state.selectedConceptId
  );
  const connectedIds = new Set([state.selectedConceptId]);
  relatedRels.forEach(r => { connectedIds.add(r.sourceId); connectedIds.add(r.targetId); });

  const nodes = concepts.filter(c => connectedIds.has(c.id)).map(c => ({
    data: {
      id: c.id, label: c.name,
      color: '#3b82f6',
      isCenter: c.id === state.selectedConceptId,
    },
  }));

  const edges = relatedRels.map(r => ({
    data: {
      id: r.id, source: r.sourceId, target: r.targetId,
      color: RELATION_COLORS[r.type] || '#6b7280',
    },
  }));

  if (state.cyMini) state.cyMini.destroy();

  state.cyMini = cytoscape({
    container: container,
    elements: [...nodes, ...edges],
    style: [
      { selector: 'node', style: {
        'label': 'data(label)', 'background-color': 'data(color)',
        'color': '#e2e8f0', 'text-valign': 'bottom', 'text-halign': 'center',
        'font-size': '9px', 'text-margin-y': 4, 'width': 24, 'height': 24,
        'border-width': 2, 'border-color': 'data(color)', 'border-opacity': 0.3,
        'text-max-width': '70px', 'text-wrap': 'ellipsis',
      }},
      { selector: 'node[?isCenter]', style: {
        'background-color': '#6366f1', 'border-color': '#818cf8',
        'border-width': 3, 'width': 32, 'height': 32, 'font-size': '10px', 'font-weight': 'bold',
      }},
      { selector: 'edge', style: {
        'width': 1.5, 'line-color': 'data(color)', 'target-arrow-color': 'data(color)',
        'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'opacity': 0.6, 'arrow-scale': 0.7,
      }},
    ],
    layout: { name: 'cose', animate: false, nodeRepulsion: () => 6000, idealEdgeLength: () => 70, gravity: 0.3, padding: 15 },
    minZoom: 0.5, maxZoom: 2.5, wheelSensitivity: 0.3,
  });

  state.cyMini.on('tap', 'node', evt => {
    const id = evt.target.id();
    state.selectedConceptId = id;
    renderDocument();
    renderMiniGraph();
    renderTree();
  });
}

// ===== FULL GRAPH (Explore Mode) =====
function renderFullGraph() {
  const container = document.getElementById('full-graph-container');
  if (!container || container.offsetWidth === 0) return;

  const nodes = concepts.map(c => ({
    data: { id: c.id, label: c.name, color: '#3b82f6', isSelected: c.id === state.selectedConceptId, type: c.type },
  }));

  const edges = relations.map(r => ({
    data: { id: r.id, source: r.sourceId, target: r.targetId, color: RELATION_COLORS[r.type] || '#6b7280' },
  }));

  if (state.cyFull) state.cyFull.destroy();

  state.cyFull = cytoscape({
    container: container,
    elements: [...nodes, ...edges],
    style: [
      { selector: 'node', style: {
        'label': 'data(label)', 'background-color': 'data(color)',
        'color': '#e2e8f0', 'text-valign': 'bottom', 'text-halign': 'center',
        'font-size': '11px', 'text-margin-y': 6, 'width': 32, 'height': 32,
        'border-width': 2, 'border-color': 'data(color)', 'border-opacity': 0.3,
        'text-max-width': '80px', 'text-wrap': 'ellipsis',
      }},
      { selector: 'node[?isSelected]', style: {
        'background-color': '#6366f1', 'border-color': '#818cf8',
        'border-width': 4, 'width': 44, 'height': 44, 'font-size': '13px', 'font-weight': 'bold',
      }},
      { selector: 'edge', style: {
        'width': 1.5, 'line-color': 'data(color)', 'target-arrow-color': 'data(color)',
        'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'opacity': 0.5, 'arrow-scale': 0.8,
      }},
    ],
    layout: { name: 'cose', animate: false, nodeRepulsion: () => 10000, idealEdgeLength: () => 110, gravity: 0.12, padding: 40 },
    minZoom: 0.3, maxZoom: 3, wheelSensitivity: 0.3,
  });

  state.cyFull.on('tap', 'node', evt => {
    const id = evt.target.id();
    state.selectedConceptId = id;
    renderFullGraph();
    renderExploreInfo();
    // Also update tree & document for when user switches back
    renderTree();
    renderDocument();
    renderMiniGraph();
  });

  renderExploreInfo();
}

function renderExploreInfo() {
  const infoEl = document.getElementById('explore-info');
  const breadcrumb = document.getElementById('explore-breadcrumb');
  const concept = getConceptById(state.selectedConceptId);

  if (!concept) {
    infoEl.classList.add('hidden');
    breadcrumb.textContent = '';
    return;
  }

  const rels = getRelationsForConcept(concept.id).filter(r => !r.isHierarchical);
  infoEl.classList.remove('hidden');
  infoEl.innerHTML = `
    <div class="explore-info-title">${concept.name}</div>
    <div class="explore-info-path">${concept.taxonomyPath.split('.').join(' › ')}</div>
    <div class="explore-info-summary">${concept.summary}</div>
    ${rels.length > 0 ? `<div class="explore-info-relations">
      ${rels.slice(0, 5).map(r => `<span class="relation-badge" style="background:${RELATION_COLORS[r.type]}20;color:${RELATION_COLORS[r.type]}">${RELATION_LABELS[r.type]}</span>`).join('')}
      ${rels.length > 5 ? `<span style="font-size:11px;color:#64748b">+${rels.length - 5}</span>` : ''}
    </div>` : ''}
  `;

  breadcrumb.textContent = `📍 현재 위치: ${concept.taxonomyPath.split('.').join(' › ')}`;
}

// ===== LEARN MODE =====
function renderLearnView() {
  const container = document.getElementById('learn-container');

  if (!state.selectedPathId) {
    // Show path selection
    container.innerHTML = `
      <div class="learn-header">
        <h2>🎯 학습 경로</h2>
        <p>목표를 선택하면 최적 학습 순서를 안내합니다.</p>
      </div>
      <div class="path-list">
        ${learningPaths.map(path => {
          const totalMin = path.steps.reduce((s, st) => s + st.estimatedMinutes, 0);
          const h = Math.floor(totalMin / 60);
          const m = totalMin % 60;
          return `<button class="path-card" data-path="${path.id}">
            <div class="path-card-title">${path.title}</div>
            <div class="path-card-goal">${path.goal}</div>
            <div class="path-card-meta">
              <span>🎯 ${path.steps.length}단계</span>
              <span>🕐 ${h > 0 ? h + '시간 ' : ''}${m > 0 ? m + '분' : ''}</span>
            </div>
          </button>`;
        }).join('')}
      </div>
    `;
    container.querySelectorAll('.path-card').forEach(card => {
      card.addEventListener('click', () => {
        state.selectedPathId = card.dataset.path;
        renderLearnView();
      });
    });
    return;
  }

  // Show selected path progress
  const path = learningPaths.find(p => p.id === state.selectedPathId);
  if (!path) return;

  const completedCount = path.steps.filter(s => state.completedSteps.has(s.conceptId)).length;
  const totalSteps = path.steps.length;
  const progress = Math.round((completedCount / totalSteps) * 100);
  const remainingMin = path.steps.filter(s => !state.completedSteps.has(s.conceptId))
    .reduce((s, st) => s + st.estimatedMinutes, 0);

  container.innerHTML = `
    <button class="path-back-btn">← 경로 목록으로</button>
    <div class="learn-header">
      <h2>${path.title}</h2>
      <p>${path.goal}</p>
    </div>
    <div class="progress-card">
      <div class="progress-header">
        <span class="progress-label">진행도</span>
        <span class="progress-percent">${progress}%</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
      <div class="progress-footer">
        <span>${completedCount}/${totalSteps} 완료</span>
        <span>남은 시간: 약 ${Math.ceil(remainingMin / 60)}시간 ${remainingMin % 60}분</span>
      </div>
    </div>
    <div class="step-list">
      ${path.steps.map((step, idx) => {
        const concept = getConceptById(step.conceptId);
        if (!concept) return '';
        const isCompleted = state.completedSteps.has(step.conceptId);
        const isNext = !isCompleted && (idx === 0 || state.completedSteps.has(path.steps[idx - 1]?.conceptId));
        const statusClass = isCompleted ? 'completed' : isNext ? 'next' : 'pending';
        return `<div class="step-item ${statusClass}">
          <button class="step-check ${statusClass}" data-concept="${step.conceptId}">
            ${isCompleted ? '✓' : isNext ? '○' : ''}
          </button>
          <span class="step-order">${String(idx + 1).padStart(2, '0')}</span>
          <div class="step-info">
            <span class="step-name" data-concept="${step.conceptId}">${concept.name}</span>
            <div class="step-summary">${concept.summary}</div>
          </div>
          <span class="step-time">🕐 ${step.estimatedMinutes}분</span>
          ${isNext ? `<button class="step-go-btn" data-concept="${step.conceptId}">학습 →</button>` : ''}
        </div>`;
      }).join('')}
    </div>
  `;

  // Event handlers
  container.querySelector('.path-back-btn').addEventListener('click', () => {
    state.selectedPathId = null;
    renderLearnView();
  });

  container.querySelectorAll('.step-check').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.concept;
      if (state.completedSteps.has(id)) {
        state.completedSteps.delete(id);
      } else {
        state.completedSteps.add(id);
      }
      renderLearnView();
    });
  });

  container.querySelectorAll('.step-name, .step-go-btn').forEach(el => {
    el.addEventListener('click', () => {
      state.selectedConceptId = el.dataset.concept;
      setMode('structure');
      renderDocument();
      renderMiniGraph();
      renderTree();
    });
  });
}

// ===== SEARCH =====
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');
const searchDropdown = document.getElementById('search-dropdown');

searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase();
  searchClear.classList.toggle('hidden', !query);

  if (!query) {
    searchDropdown.classList.add('hidden');
    return;
  }

  const results = concepts.filter(c =>
    c.name.toLowerCase().includes(query) || c.summary.toLowerCase().includes(query)
  ).slice(0, 8);

  if (results.length === 0) {
    searchDropdown.classList.add('hidden');
    return;
  }

  searchDropdown.classList.remove('hidden');
  searchDropdown.innerHTML = results.map(c => `
    <button class="search-result-item" data-id="${c.id}">
      <div class="search-result-name">${c.name}</div>
      <div class="search-result-summary">${c.summary}</div>
      <div class="search-result-path">${c.taxonomyPath.split('.').join(' › ')}</div>
    </button>
  `).join('');

  searchDropdown.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      state.selectedConceptId = item.dataset.id;
      searchInput.value = '';
      searchClear.classList.add('hidden');
      searchDropdown.classList.add('hidden');
      setMode('structure');
      renderTree();
      renderDocument();
      renderMiniGraph();
      // Expand tree to show selected concept
      expandTreeToConceptId(item.dataset.id);
    });
  });
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchClear.classList.add('hidden');
  searchDropdown.classList.add('hidden');
});

// Close dropdown on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('.header-right')) {
    searchDropdown.classList.add('hidden');
  }
});

// Expand tree to show a concept
function expandTreeToConceptId(conceptId) {
  function findAndExpand(node, ancestors) {
    if (node.conceptId === conceptId) {
      ancestors.forEach(a => state.expandedNodes.add(a.id));
      return true;
    }
    if (node.children) {
      for (const child of node.children) {
        if (findAndExpand(child, [...ancestors, node])) return true;
      }
    }
    return false;
  }
  findAndExpand(taxonomy, []);
  renderTree();
}

// ===== INITIALIZATION =====
function init() {
  renderTree();
  renderDocument();
  setTimeout(() => renderMiniGraph(), 100);
}

init();
