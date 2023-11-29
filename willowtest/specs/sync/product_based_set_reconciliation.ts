import { R, def, def_fake, r, rs } from "../../../defref.ts";
import { code, em, p } from "../../../h.ts";
import { hsection } from "../../../hsection.ts";
import { Expression } from "../../../tsgen.ts";
import { def_parameter, def_value, link, lis, pinformative, site_template } from "../../main.ts";

export const range3d_based_set_reconciliation: Expression = site_template(
    {
        title: "3d-Range-Based Set Reconciliation",
        name: "3d_range_based_set_reconciliation",
    },
    [
        pinformative("Given a ", r("3d_range"), ",that both peers in a sync session (Alfie and Betty) know, how can they efficiently update each other about their ", rs("entry"), " in that ", r("3d_range"), "? In this document we describe ", def({ id: "3drbsr", singular: "3d-range-based set reconciliation"}), ", three dimensional extension of ", link("range-based set reconciliation", "https://arxiv.org/pdf/2212.13567.pdf"), " for solving this problem."),

        pinformative("The general idea of ", r("3drbsr"), " is to have Alfie send a small ", def({ id: "entry_fingerprint", singular: "fingerprint"}), " over all his ", rs("entry"), " in the ", r("3d_range"), ". Upon receiving this ", r("entry_fingerprint"), ", Betty computes the ", r("entry_fingerprint"), " over all of ", em("her"), " ", rs("entry"), " in the same ", r("3d_range"), ". If the ", rs("entry_fingerprint"), " match, she can conclude that no further data exchange is necessary."),

        pinformative("Otherwise, Betty splits the ", r("3d_range"), " into two smaller ", rs("3d_range"), " (call them ", def_value("sub1"), " and ", def_value("sub2"), ") that contain roughly half of her ", rs("entry"), " (from the original ", r("3d_range"), ") each and whose union gives the original ", r("3d_range"), " again. Then she computes the ", rs("entry_fingerprint"), " of all ", rs("entry"), " in ", r("sub1"), " and sends both ", r("sub1"), " (the three ", rs("range"), " that make up ", r("sub1"), ", not its ", rs("entry"), ") and its ", r("entry_fingerprint"), " to Alfie. This combination of a ", r("3d_range"), " and a ", r("entry_fingerprint"), " is called a ", def({id: "range_fingerprint", singular: "range fingerprint"}), ". She also sends the ", r("range_fingerprint"), " for ", r("sub2"), ". Note that the initial mesage where Alfie sent his ", r("entry_fingerprint"), " for the initial ", r("3d_range"), " has been a ", r("range_fingerprint"), " as well."),

        pinformative("When Alfie receives these ", rs("range_fingerprint"), ", he can handle them in exactly the same way: he computes his local ", r("entry_fingerprint"), " over the same ", r("3d_range"), ", compares the ", rs("entry_fingerprint"), ", knows that no further work is necessary if they are equal, and otherwise processes the ", r("3d_range"), " by splitting it."),

        pinformative("At any point, a peer can opt to send a ", r("range_entry_set"), " instead of a ", r("range_fingerprint"), ". A ", def({id: "range_entry_set", singular: "range_entry_set"}), " consists of a ", r("3d_range"), ", the set of all ", rs("entry"), " that the peer has within that ", r("3d_range"), ", and a boolean flag to indicate whether the other peer should reply with its ", r("range_entry_set"), " for the same ", r("3d_range"), " as well. Such a reply should ", em("not"), " set that flag, and it should not contain any of the ", rs("entry"), " that were part of the ", r("range_entry_set"), " that it is replying to."),

        pinformative("By recursively splitting ", rs("3d_range"), " with non-equal ", rs("entry_fingerprint"), ", the peers can drill down to the subareas where actual reconciliation (by exchanging ", r("range_entry_set"), ") is required. Note that the peers need not agree on when to switch from ", rs("range_fingerprint"), " to ", rs("range_entry_said"), ", or even on into how many ", rs("3d_range"), " to subdivide in each recursion step. As long as they both make some kind of progress on every ", r("range_fingerprint"), " they receive, they will successfully reconcile their ", rs("entry"), "."),

        pinformative("In willow, it is possible for a peer to have an entry but to not hold its full payload. We can easily modify ", r("3drbsr"), " to let peers detect partial payloads on which they could make progress, by incorporating the length of the locally available payload bytes into each ", r("entry_fingerprint"), ". More precisely, let ", code("e"), " be an ", r("entry"), ", and let ", code("l"), " be the number of consecutive bytes from the start of the payload of ", code("e"), " that is locally available. Then we call the pair of ", code("e"), " and ", code("l"), " a ", def({id: "lengthy_entry", singular: "lengthy entry", plural: "lengthy entries"}, "lengthy entry", ["A ", def_fake("lengthy_entry", "lengthy entry"), " is a pair of an ", r("entry"), " and a 64 bit unsigned integer that denotes the number of consecutive bytes from the start of the ", r("entry"), "'s payload that is available to the peer."]), "."),

        hsection("3drbsr_parameters", "Parameters", [
            pinformative(R("3drbsr"), " requires the ability to hash arbitrary sets of ", rs("lengthy_entry") , " into values of a type ", def_parameter({id: "3drbsr_fingerprint", singular: "Fingerprint"}), " via a function ", def_parameter({id: "3drbsr_fp", singular: "fingerprint"}), ". In order to allow for certain efficient implementation techniques, ", r("3drbsr_fp"), " is not an arbitrary protocol parameter but is constructed from some other protocol parameters."),

            pinformative("First, we require a function ", def_parameter({id: "3drbsr_fp_singleton", singular: "fingerprint_singleton"}), " that hashes individual ", rs("lengthy_entry"), " into the set ", r("3drbsr_fingerprint"), ". This hash function should take into account all aspects of the ", r("lengthy_entry"), ": modifying its ", r("namespace_id"), ", ", r("subspace_id"), ", ", r("path"), ", ", r("timestamp"), ", ", r("entry_length"), ", ", r("entry_hash"), ", or the number of available bytes, should result in a completely different ", r("entry_fingerprint"), "."),

            pinformative("Second, we require an ", link("associative", "https://en.wikipedia.org/wiki/Associative_property"), ", ", link("commutative", "https://en.wikipedia.org/wiki/Commutative_property"), " function ", def_parameter({id: "3drbsr_fp_combine", singular: "fingerprint_combine"}), " that maps two ", rs("3drbsr_fingerprint"), " to a single new ", r("3drbsr_fingerprint"), ", with a ", link("neutral element", "https://en.wikipedia.org/wiki/Identity_element"), " ", def({id: "3drbsr_neutral", singular: "fingerprint_neutral"}), "."),

            pinformative("Given these protocol parameters, the function ", r("3drbsr_fp"), " is defined as follows:"),

            lis(
                ["applying ", r("3drbsr_fp"), " to the empty set yields ", r("3drbsr_neutral"), ","],
                ["applying ", r("3drbsr_fp"), " to a set containing exactly one ", r("lengthy_entry"), " yields the same result as applying ", r("3drbsr_fp_singleton"), " to that entry, and"],
                ["applying ", r("3drbsr_fp"), " to any other set of ", rs("lengthy_entry"), " yields the result of applying ", r("3drbsr_fp_singleton"), " to all members of the set individually and then combining the resulting ", rs("entry_fingerprint"), " with ", r("3drbsr_fp_combine"), " (grouping and ordering do not matter because of associativity and commutativity respectively)."],
            ),
        ]),
    ],
);
