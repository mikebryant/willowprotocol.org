import { def } from "../../../defref.ts";
import { p } from "../../../h.ts";
import { Expression } from "../../../tsgen.ts";
import { site_template } from "../../main.ts";

export const timestamps_really: Expression = site_template(
    {
        title: "Timestamps, really?",
        name: "timestamps_really",
    },
    [
        p("TODO"),
    ],
);

/*

Willow implements a key-value store, and a key-value store can map any one key to at most one value. Willow uses *timestamps* to resolve conflicting mappings. This design decision might trigger some healthy skepticism, so this text walks you through our reasoning for building them into the protocol.

## Why Timestamps are Suspicious

We start by laying out why unreflected usage of timestamps is a bad idea; both to give a solid foundation to our arguments in favor of using them regardless, and to give you a clear picture of which blind spots we might have (please reach out and tell us about them).

Peer-to-peer systems operate in an asynchronous model of communication: peers cannot know how long it takes until a communication of theirs reaches its recipient. This networking model is full of <s>depressing</s> *fun* impossibility results, such as the impossibility of [reaching consensus](https://en.wikipedia.org/wiki/Consensus_(computer_science)#The_FLP_impossibility_result_for_asynchronous_deterministic_consensus). If it was possible to reach consensus in a peer-to-peer system, it could collectively act like a large, centralised system, simplifying many design issues.

Assuming that everyone agrees on the same numeric representation of time at a given instant would mean that everyone reached *consensus* on the time. Which is impossible. So any system that *relies* on accurate timestamps is a centralised system in disguise.

But isn't time a physical phenomenon that resides outside these mathematical formalisms and that can be accurately tracked by fully independent devices? Unfortunately not. Any physical clock will exhibit [clock drift](https://en.wikipedia.org/wiki/Clock_drift), no two clocks can be assumed to stay in perfect sync forever. Relativity throws in a few more wrenches, earth satellites already have to account for time dilation.

The gist is that there can be no globally shared understanding of time, we can only reason about the local understanding of time of each participant in a distributed system. [Clock synchronisation](https://en.wikipedia.org/wiki/Clock_synchronization) can go a long way, but requires connectivity and limits on how long it takes to transmit messages. A "proper" distributed system opts for [logical clocks](https://en.wikipedia.org/wiki/Logical_clock), tracking the [happened-before](https://en.wikipedia.org/wiki/Happened-before) relation of events in [vector clocks](https://en.wikipedia.org/wiki/Vector_clock) (or any of their many relatives).

Relying on timestamps has another problem: we cannot trust our peers to be truthful. Any participant might claim its entries to have arbitrary timestamps, whether from the distant future or the distant past. And while we might be fine with simply shunning obvious liars from our set of peers, even a non-malicious peer might accidentally create entries with bogus timestamps if their operating system has funny ideas about their current time.

## Why We Use Timestamps Anyways

Vector clocks that track the happened-before relation are real, and absolute timestamps are not. Why not use vector clocks then? First, tracking the happened-before relation accurately requires space proportional to the greatest number of concurrent events, a number we cannot bound in a peer-to-peer system. And second, it simply doesn't help us: many entries will still be created concurrently, and we still have to deterministically choose a winner. (Aside: we "have to" in order to guarantee [eventual consistency](https://en.wikipedia.org/wiki/Eventual_consistency), which is a non-negotiable aim of Willow.)

Mapping a set of concurrently created entries to a single winner cannot be done in a fully satisfactory way, but we can at least try to improve the situation: by annotating every entry with its timestamp. *If* the issuers are truthful and have sufficiently synchronised clocks, we get the expected outcome of the newest entry winning. That's a lot better than taking a purist view and choosing, for example, the entry with the lowest hash. In case of tied timestamps, we can safely fall back to the hash option (and distinct entries never hash to the same digest by assumption).

Willow does not rely on timestamps to be accurate — we still get well-defined, eventually-consistent behaviour even if authors choose their timestamps arbitrarily. They simply provide a significant improvement in terms of the intuitively expected behaviour in the happy case. And we can argue that the happy case is quite common.

<aside>You might have more stringent requirements in terms of accuracy, in which case another, specialised system would be superior for your use-case. That's okay, a rather general-purpose protocol like Willow cannot fit everybody's needs.</aside>

While clock drift is an issue in theory, most clocks are actually quite good in practice (as are the clock synchronisation algorithms your operating system employs without you knowing). When is the last time you missed an appointment because of digital clock drift? If you have a clear intuitive sense of which of two entries is "newer", chances are the devices that produced those entries have given them timestamps that reflect your perception.

If an author is malicious, that author can deliberately choose a high timestamp to make its entry the winner. But that's not a useful argument against timestamps, because *any* deterministic solution (that gives all authors a fair treatment) can be gamed. If we decided by lowest hash, the malicious author could make semantically meaningless changes to their data until it hashed to a sufficiently low value.

## Handling Rogue Timestamps

These arguments hopefully sound convincing, yet we cannot justify using timestamps by exclusively focusing on the happy case. So now we discuss the effects of maliciously (or buggily) crafted timestamps.

Willow automatically separates entries by *subspace ID*. An entry with a high timestamp only overwrites entries in the same *subspace*. If you do not allow anyone else to write to your subspace, it does not matter how devilishly clever they choose their timestamps — your data remains unaffected.

You can still collaborate with untrusted peers by aggregating data from different subspaces into a coherent view, whether through [CRDTs](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type), [operational transformations](https://en.wikipedia.org/wiki/Operational_transformation), or [abstract nonsense](https://arxiv.org/abs/1311.3903).

User interfaces that rely on timestamps might still be coaxed into undesired behaviour, but that would be just as true if the timestamps came from an entry's payload rather than its metadata. The issue of trusting timestamps in UI design (or using more secure alternatives) is removed from the underlying protocol.

But what if you yourself create an entry with an outlandish timestamp? That's where things become more problematic.

If you accidentally backdate an entry, it will vanish once it comes into contact with your own non-buggy entries (whose path is a non-strict prefix). Frustrating, but no real way around it. Fortunately, the consequences are rather limited.

If you accidentally assign a large timestamp, things are more problematic: it will overwrite all non-buggy entries (of whose path it is a non-strict prefix), and the buggy entry will replicate through the network, deleting the non-buggy entries everywhere. To add insult to injury, you cannot create any new entries with accurate timestamps (under the buggy path) until the buggily assigned time has passed. The only remedy is to get every device that stores the buggy entry (or *entries*) to locally delete them at the same time, before resuming data replication. This is quite an effort for small networks, and completely infeasible for large networks.

This is bad. It should only happen very rarely, but it still makes sense to implement additional countermeasures. First, any API to create entries of the current time can be hardcoded to raise an error if its time source reports a timestamp that unrealistically diverges from the implementation time. And second, peers can and should simply reject incoming entries that were created too far in the future compared to their local time. This way, buggy entries stay isolated on the offending device rather than polluting the network.

An appropriate definition of "too far in the future" depends on the expected clock-drift and can hence be fairly accurate. Rejecting entries ten minutes from the future should be more than enough to account for any clock drift that can be considered non-buggy. But there are good reasons for future-dating entries in the context of moderation, which brings us to the next topic: capabilities.

## Timestamps in Meadowcap

<aside>Meadowcap is a security component. There will be no happy-case reasoning here, only adversarially chosen timestamps.</aside>

Willow allows write-access control via the `is_authorised_write` function, which receives a full entry as input — including its timestamp. [Meadowcap](/specs/meadowcap) (the recommended access-control system for Willow) allows to incorporate timestamps into access control. In the following, we discuss issues of timestamps with respect to Meadowcap. We assume familiarity with (the introduction of) the [Meadowcap specification](/specs/meadowcap).

When a Meadowcap capability restricts entry creation based on timestamps, this has *absolutely nothing* to do with the (physical) time at which entries are *created*. It merely restricts which times can be *claimed* as the timestamp of entries.

If you give me a capability to write entries to your subspace on the 18th of July 2024, I can still create entries in 2032 and add them to your subspace, but only if I give them a timestamp for the 18th of July 2024. And you can make sure that no such entry will be propagated by creating your own entries whose timestamp is higher than that of the 18th of July 2024.

Repeatedly handing out capabilities that grant access for a small time span is how to imitate the concept of revoking rights in a more centralised environment: you simply do not renew someone's capability, and they cannot create accurately timestamps entries once their last capability has expired. And by creating newer entries, you make sure that someone with an expired capability cannot make their writes propagate anymore.

There is an inherent tension between latency and offline-firstness here. Low latency in access revocation requires short-lived capabilities, but those need to be continuously renewed by contacting the authority that issues the capabilities. If I can only connect to the Internet once every three months, I need long-lived capabilities.

The correct trade-off depends on the specific situation, it might even be impossible to know in advance. If this sounds discouraging, remember that centralised systems cannot tolerate *any* period of disconnectivity.

Write capabilities also happen to provide another layer of protection against accidentally future-dating your own entries. If my write capability reaches only one week into the future, I can start mitigating the damage done by an accidental future-dating after a single week. Furthermore, the buggy clock has to produce a time in the valid range, whereas other buggy timestamps would be filtered out immediately, leaving the subspace unpolluted.

The system of expiring capabilities does provide a good reason for future-dating entries: a moderator can irrevocably (for the original author) delete an entry by overwriting it with another entry whose timestamp is greater than the greatest time at which the original author can date their entries. Hence, peers should adjust the safeguard time difference they allow between new entries and their local clock to allow for moderations (for example by only rejecting entries whose time difference exceeds the longest issued capability lifetime by 1 extra minute). 

## Conclusion

Relying on accurate timestamps is a recipe for disaster. Fortunately, Willow doesn't.

If you feel like we are missing some vital points or rely on faulty arguments, please <a href="mailto:mail@aljoscha-meyer.de,sam@gwil.garden">reach out</a>.
*/