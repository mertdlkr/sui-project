module challenge::marketplace;

use challenge::hero::Hero;
use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{self, ID, UID};
use sui::sui::SUI;
use sui::transfer;
use sui::tx_context::TxContext;

// ========= ERRORS =========

const EInvalidPayment: u64 = 1;

// ========= STRUCTS =========

public struct ListHero has key, store {
    id: UID,
    nft: Hero,
    price: u64,
    seller: address,
}

// ========= CAPABILITIES =========

public struct AdminCap has key, store {
    id: UID,
}

// ========= EVENTS =========

public struct HeroListed has copy, drop {
    list_hero_id: ID,
    price: u64,
    seller: address,
    timestamp: u64,
}

public struct HeroBought has copy, drop {
    list_hero_id: ID,
    price: u64,
    buyer: address,
    seller: address,
    timestamp: u64,
}

// ========= FUNCTIONS =========

fun init(ctx: &mut TxContext) {
    let admin_cap = AdminCap { id: object::new(ctx) };
    transfer::public_transfer(admin_cap, ctx.sender());
}

public fun list_hero(nft: Hero, price: u64, ctx: &mut TxContext) {
    let seller = ctx.sender();
    let listing = ListHero {
        id: object::new(ctx),
        nft,
        price,
        seller,
    };
    let list_hero_id = object::id(&listing);
    let timestamp = ctx.epoch_timestamp_ms();

    event::emit(HeroListed {
        list_hero_id,
        price,
        seller,
        timestamp,
    });
    transfer::share_object(listing);
}

#[allow(lint(self_transfer))]
public fun buy_hero(list_hero: ListHero, coin: Coin<SUI>, ctx: &mut TxContext) {
    let ListHero { id, nft, price, seller } = list_hero;
    assert!(coin::value(&coin) == price, EInvalidPayment);

    transfer::public_transfer(coin, seller);
    let buyer = ctx.sender();
    transfer::transfer(nft, buyer);

    event::emit(HeroBought {
        list_hero_id: object::uid_to_inner(&id),
        price,
        buyer,
        seller,
        timestamp: ctx.epoch_timestamp_ms(),
    });

    object::delete(id);
}

// ========= ADMIN FUNCTIONS =========

public fun delist(_: &AdminCap, list_hero: ListHero) {
    let ListHero { id, nft, price: _, seller } = list_hero;
    transfer::transfer(nft, seller);
    object::delete(id);
}

public fun change_the_price(_: &AdminCap, list_hero: &mut ListHero, new_price: u64) {
    list_hero.price = new_price;
}

// ========= GETTER FUNCTIONS =========

#[test_only]
public fun listing_price(list_hero: &ListHero): u64 {
    list_hero.price
}

// ========= TEST ONLY FUNCTIONS =========

#[test_only]
public fun test_init(ctx: &mut TxContext) {
    let admin_cap = AdminCap {
        id: object::new(ctx),
    };
    transfer::transfer(admin_cap, ctx.sender());
}
