# ResizeObserver를 활용한 초기 크기 측정 개선 방안

## 현재 문제점

현재 코드는 두 번의 `requestAnimationFrame`을 사용하여 레이아웃 완료를 보장하고 있습니다:
```typescript
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    // 크기 측정 및 조정
  });
});
```

이 방식의 문제점:
- 코드 복잡도 증가
- 불필요한 지연 발생 가능
- 성능 오버헤드

## 개선 방안

### 방안 1: ResizeObserver의 첫 콜백 활용 (권장)

`ResizeObserver`는 이미 레이아웃이 완료된 후에 콜백을 호출합니다. 따라서 첫 번째 콜백에서 초기 크기를 처리할 수 있습니다.

**장점:**
- `requestAnimationFrame` 불필요
- 브라우저가 최적의 타이밍에 콜백 호출
- 코드 단순화

**구현:**
```typescript
private setupAutoResize(): void {
  if (typeof ResizeObserver === 'undefined') {
    return;
  }

  let isFirstCallback = true;
  
  this.resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        if (isFirstCallback) {
          // 첫 번째 콜백: 초기 크기 설정
          isFirstCallback = false;
          this.resize(Math.floor(width), Math.floor(height));
        } else {
          // 이후 콜백: 크기 변경 처리
          this.resize(Math.floor(width), Math.floor(height));
        }
      }
    }
  });

  this.resizeObserver.observe(this.container);
}
```

### 방안 2: ResizeObserver 즉시 트리거

`ResizeObserver`를 설정한 후 강제로 한 번 트리거하는 방법입니다.

**장점:**
- 명시적인 초기 크기 측정
- ResizeObserver의 일관된 동작 보장

**구현:**
```typescript
// ResizeObserver 설정 후
this.resizeObserver.observe(this.container);

// 강제로 한 번 트리거 (크기가 변경되지 않아도 콜백 호출)
// 하지만 이 방법은 표준 API가 아니므로 사용 불가
```

### 방안 3: 조건부 requestAnimationFrame

초기 크기가 유효한 경우 `requestAnimationFrame`을 사용하지 않습니다.

**장점:**
- 대부분의 경우 즉시 렌더링
- 필요한 경우에만 지연

**구현:**
```typescript
const rect = container.getBoundingClientRect();
const initialWidth = Math.floor(rect.width);
const initialHeight = Math.floor(rect.height);

if (initialWidth > 0 && initialHeight > 0) {
  // 크기가 유효하면 즉시 사용
  width = initialWidth;
  height = initialHeight;
} else {
  // 크기가 0이면 requestAnimationFrame 사용
  requestAnimationFrame(() => {
    // 재측정
  });
}
```

### 방안 4: ResizeObserver + 초기 크기 검증

`ResizeObserver`를 먼저 설정하고, 초기 크기가 유효하지 않은 경우에만 `requestAnimationFrame` 사용.

**장점:**
- ResizeObserver가 대부분의 경우 처리
- 예외 상황만 requestAnimationFrame 사용

## 권장 구현

**방안 1 (ResizeObserver 첫 콜백 활용)**을 권장합니다:

1. ResizeObserver는 이미 레이아웃 완료 후 콜백 호출
2. 첫 번째 콜백에서 초기 크기 처리
3. 추가적인 requestAnimationFrame 불필요
4. 코드 단순화 및 성능 개선

**주의사항:**
- ResizeObserver가 즉시 콜백을 호출하지 않을 수 있으므로, 초기 렌더링은 임시 크기로 진행
- 첫 번째 콜백에서 정확한 크기로 재렌더링

