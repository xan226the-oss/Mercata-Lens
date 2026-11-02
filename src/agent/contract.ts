/** Responses are usable only for the active request and immutable research revision. */
export interface AgentReply { requestId:string; revision:string; answer:string; reviewIds:string[] }
export interface Message { id:string; role:'user'|'assistant'; content:string; revision:string; reviewIds:string[] }
export function verifyReply(raw:unknown, requestId:string, revision:string, validIds:ReadonlySet<string>):AgentReply {
 const r=raw as Partial<AgentReply>|null;
 if(!r||r.requestId!==requestId||r.revision!==revision||typeof r.answer!=='string'||!r.answer.trim()||r.answer.length>6000||/[0-9０-９]/u.test(r.answer)||!Array.isArray(r.reviewIds)||!r.reviewIds.length||r.reviewIds.length>12||r.reviewIds.some(id=>typeof id!=='string'||!validIds.has(id)))throw new Error('unverified_response');
 return {requestId,revision,answer:r.answer,reviewIds:[...new Set(r.reviewIds)]};
}
