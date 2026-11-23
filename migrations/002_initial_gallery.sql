BEGIN;

INSERT INTO gallery_cases (id, data) VALUES
  ('cafe', '{"id": "cafe", "category": "카페", "title": "공간의 중심이 되는 맞춤 카운터", "short": "맞춤 카운터", "image": "01_hero_cafe_wide-clean.png", "sub": "주문과 픽업, 자연스러운 동선", "products": "카운터 · 하부 수납", "material": "우드 계열 면재와 내구성을 고려한 상판", "finish": "따뜻한 우드 톤과 차분한 무광 마감", "condition": "커피 머신·냉장고 규격, 급배수 위치, 주문·픽업 동선", "desc": "손님을 맞이하는 자리와 작업하는 자리가 자연스럽게 이어지도록. 장비의 위치와 수납 방식을 함께 생각한 카페 카운터의 가상 제안입니다.", "photos": ["/assets/01_hero_cafe_wide-clean.png"], "ai": true}'::jsonb),
  ('store', '{"id": "store", "category": "매장", "title": "상품이 잘 보이는 진열대", "short": "진열대", "image": "06_store_counter_total-clean.png", "sub": "상품과 공간에 맞춘 높이", "products": "진열대 · 계산대 · 수납", "material": "우드 계열 면재와 용도에 맞춘 구조재", "finish": "상품의 색을 방해하지 않는 내추럴 톤", "condition": "상품 크기와 하중, 고객 통로 폭, 콘센트 위치", "desc": "상품을 보는 눈높이와 손이 닿는 높이를 함께 생각합니다. 진열과 정리, 응대가 한 공간에서 편안하게 이루어지는 매장을 위한 가상 제안입니다.", "photos": ["/assets/06_store_counter_total-clean.png"], "ai": true}'::jsonb),
  ('office', '{"id": "office", "category": "사무실", "title": "함께 쓰기 편한 테이블과 수납장", "short": "회의 테이블과 수납장", "image": "07_office_storage_total-clean.png", "sub": "일하는 공간을 더 단정하게", "products": "회의 테이블 · 벽면 수납장", "material": "우드 계열 상판과 용도에 맞춘 하부 구조", "finish": "장시간 사용하는 공간에 어울리는 무광 우드 톤", "condition": "사용 인원, 배선 경로, 의자 이동 공간, 벽면 치수", "desc": "대화를 나누는 테이블부터 매일 사용하는 수납까지. 사람의 움직임과 필요한 물건의 자리를 함께 정리하는 사무실 가구의 가상 제안입니다.", "photos": ["/assets/07_office_storage_total-clean.png"], "ai": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

COMMIT;
