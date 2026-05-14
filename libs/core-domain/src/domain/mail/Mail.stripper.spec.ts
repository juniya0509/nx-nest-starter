import { MailStripper } from './Mail.stripper';

describe('MailStripper', () => {
  const stripper = new MailStripper();

  it('태그를 모두 제거', () => {
    expect(stripper.strip('<p>본문</p>')).toBe('본문');
  });

  it('<br> 은 줄바꿈으로 변환', () => {
    expect(stripper.strip('first<br>second')).toBe('first\nsecond');
  });

  it('</p> 는 빈 줄로 변환', () => {
    expect(stripper.strip('<p>first</p><p>second</p>')).toBe('first\n\nsecond');
  });

  it('연속 줄바꿈 3개 이상은 2개로 압축', () => {
    expect(stripper.strip('a<br><br><br><br>b')).toBe('a\n\nb');
  });

  it('앞뒤 공백 trim', () => {
    expect(stripper.strip('   <p>x</p>   ')).toBe('x');
  });
});
