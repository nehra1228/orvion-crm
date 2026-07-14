type Subscriber = {
  id: string;
  push: (payload: string) => void;
};

const subs = new Map<string, Subscriber[]>();

export function subscribe(userId: string, subscriber: Subscriber) {
  const arr = subs.get(userId) || [];
  arr.push(subscriber);
  subs.set(userId, arr);
}

export function unsubscribe(userId: string, id: string) {
  const arr = subs.get(userId) || [];
  subs.set(userId, arr.filter((s) => s.id !== id));
}

export function publish(userId: string, payload: any) {
  const arr = subs.get(userId) || [];
  const data = typeof payload === "string" ? payload : JSON.stringify(payload);
  arr.forEach((s) => {
    try {
      s.push(data);
    } catch (e) {
      // ignore
    }
  });
}
