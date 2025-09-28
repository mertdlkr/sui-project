module challenge::arena;

use challenge::hero::{self, Hero};
use sui::event;
use sui::object::{self, ID, UID};
use sui::transfer;
use sui::tx_context::TxContext;

// ========= STRUCTS =========

public struct Arena has key, store {
    id: UID,
    warrior: Hero,
    owner: address,
}

// ========= EVENTS =========

public struct ArenaCreated has copy, drop {
    arena_id: ID,
    timestamp: u64,
}

public struct ArenaCompleted has copy, drop {
    winner_hero_id: ID,
    loser_hero_id: ID,
    timestamp: u64,
}

// ========= FUNCTIONS =========

public fun create_arena(hero: Hero, ctx: &mut TxContext) {
    let arena = Arena {
        id: object::new(ctx),
        warrior: hero,
        owner: ctx.sender(),
    };
    let arena_id = object::id(&arena);
    let timestamp = ctx.epoch_timestamp_ms();

    event::emit(ArenaCreated { arena_id, timestamp });
    transfer::share_object(arena);
}

#[allow(lint(self_transfer))]
public fun battle(hero: Hero, arena: Arena, ctx: &mut TxContext) {
    let Arena { id, warrior, owner } = arena;
    let hero_power = hero::hero_power(&hero);
    let warrior_power = hero::hero_power(&warrior);
    let hero_id = object::id(&hero);
    let warrior_id = object::id(&warrior);
    let timestamp = ctx.epoch_timestamp_ms();

    if (hero_power >= warrior_power) {
        transfer::transfer(warrior, ctx.sender());
        transfer::transfer(hero, ctx.sender());
        event::emit(ArenaCompleted {
            winner_hero_id: hero_id,
            loser_hero_id: warrior_id,
            timestamp,
        });
    } else {
        transfer::transfer(hero, owner);
        transfer::transfer(warrior, owner);
        event::emit(ArenaCompleted {
            winner_hero_id: warrior_id,
            loser_hero_id: hero_id,
            timestamp,
        });
    };

    object::delete(id);
}
