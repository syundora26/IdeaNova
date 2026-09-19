import { describe, it, expect } from 'vitest';
import { emptyCarts, setCartQuantity, restoreCarts, cartTotal } from '../src/data';
describe('Separate business carts',()=>{
 it('never mixes products from different businesses',()=>{const cart=setCartQuantity(emptyCarts(),'cosmetics','a01',2);expect(cart.cosmetics).toEqual([]);expect(cart.agriculture).toEqual([])});
 it('updates one business without changing the other',()=>{let c=setCartQuantity(emptyCarts(),'cosmetics','c01',2);c=setCartQuantity(c,'agriculture','a01',3);c=setCartQuantity(c,'cosmetics','c01',0);expect(c.cosmetics).toEqual([]);expect(c.agriculture).toEqual([{productId:'a01',quantity:3}]);expect(cartTotal(c,'agriculture')).toBe(8940)});
 it('caps stock and prevents purchasing paused products',()=>{let c=setCartQuantity(emptyCarts(),'cosmetics','c01',100);c=setCartQuantity(c,'cosmetics','c03',1);expect(c.cosmetics).toEqual([{productId:'c01',quantity:8}])});
 it('rejects invalid quantities and normalizes persisted content',()=>{const c=restoreCarts({cosmetics:[{productId:'a01',quantity:1},{productId:'c01',quantity:999},{productId:'c02',quantity:-1}],agriculture:'bad'});expect(c.cosmetics).toEqual([{productId:'c01',quantity:8}]);expect(c.agriculture).toEqual([]);expect(setCartQuantity(c,'cosmetics','c01',NaN)).toEqual(c);expect(restoreCarts(null)).toEqual(emptyCarts())});
});
