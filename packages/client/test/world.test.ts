import {describe,it,expect,vi} from 'vitest';
import {WorldConnection,WorldRefused} from '../src/net/world.ts';
describe('online world transport',()=>{
 it('creates through the account session without uploading state or owner',async()=>{
  const send=vi.fn().mockResolvedValue(new Response(JSON.stringify({data:{exists:false}})));
  await new WorldConnection(send).create();
  expect(send.mock.calls[0]![0]).toBe('/api/paradise-world');
  expect(send.mock.calls[0]![1].credentials).toBe('same-origin');
  expect(JSON.parse(send.mock.calls[0]![1].body)).toEqual({action:'create'});
 });
 it('preserves request identity and exposes conflicts without silently retrying',async()=>{
  const send=vi.fn().mockResolvedValue(new Response(JSON.stringify({error:'World changed'}),{status:409}));
  await expect(new WorldConnection(send).command('world-request-001',4,{type:'finishActivity',id:'local-id',nowMs:1})).rejects.toBeInstanceOf(WorldRefused);
  expect(send).toHaveBeenCalledTimes(1);
  expect(JSON.parse(send.mock.calls[0]![1].body)).toMatchObject({requestKey:'world-request-001',revision:4,command:{type:'finishActivity'}});
 });
});
