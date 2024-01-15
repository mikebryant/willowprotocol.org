import { Expression } from "macro";
import { link, lis, pinformative, site_template } from "../../main.ts";
import { em, img } from "../../../h.ts";
import { def } from "../../../defref.ts";
import { marginale_inlineable } from "../../../marginalia.ts";
import { asset } from "../../../out.ts";
import { hsection } from "../../../hsection.ts";

export const about: Expression = site_template(
		{
				title: "About us",
				name: "about",
		},
		[
				pinformative("Willow started as a ", link("minimalistic reimaigining", asset("about/soilsun.md")), " of ", link("Earthstar", "https://earthstar-project.org"), ". Over time, we did a ", em("lot"), " more reimagining, and a lot less minimalism."),
				
				pinformative("The path / author / timestamp model at the heart of Willow was designed by our dear departed friend Cinnamon, without whom there would be no Willow. We miss you."),
				
				pinformative("Over the course of ten months, we put a tremendous amount of work and care into the design of these protocols and the website which serves as its introduction. Here’s a little bit about us."),
				
				hsection("aljoscha_section", "Aljoscha Meyer", [
					pinformative(
						marginale_inlineable(img(asset("about/aljoscha.png")))
					)
				]),
				
				hsection("gwil_section", "Sam “gwil” Gwilym", [
					pinformative(
					marginale_inlineable(img(asset("about/gwil.png"))),
					em("I'm ", def({ id: "gwil", singular: "gwil"}, "gwil",), ". I’m a programmer, illustrator, and dad living in the Hague, the Netherlands. I’m the core maintainer of the Earthstar project, and seized upon Aljoscha’s initial designs for Willow as soon as he made the mistake of sharing them. We’ve really pushed each other to do our best work with this project, and making all the wobbly drawings for the site has been the highlight of my computer science career. Now that the protocol is nearly final, I guess I have to implement it, too? Hmmm… anyone need any drawings done?")),
					
					
					
					lis(
						link("Blog", "https://gwil.garden"),
						link("Mastodon", "https://post.lurk.org/@gwil"),
						link("Email", "mailto:sam@gwil.garden"),
					)
				]),
		],
);