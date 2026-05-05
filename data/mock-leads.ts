import type { Lead } from "@/types/crm";

const now = "2026-05-05T10:00:00.000Z";

const mk = (
  id: number,
  companyName: string,
  regionName: string,
  category: string,
  address: string,
  phone: string,
  emails: string[],
  website: string,
  contactPerson: string,
  score: number,
  chainHint: Lead["chainHint"],
  status: Lead["status"] = "NEW"
): Lead => {
  const q = score >= 88 ? "A" : score >= 74 ? "B" : score >= 58 ? "C" : "D";
  const query = encodeURIComponent(`${companyName} ${address}`);
  const phoneQuery = encodeURIComponent(phone || companyName);

  return {
    id: `lead-${id}`,
    sourceId: `mock-saar-${id}`,
    companyName,
    regionName,
    categoryGroup: "Lokales Gewerbe",
    category,
    address,
    phone,
    emails,
    website,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${query}`,
    googleSearchUrl: `https://www.google.com/search?q=${query}`,
    phoneSearchUrl: `https://www.google.com/search?q=${phoneQuery}`,
    contactPerson,
    decisionMakerPhone: "",
    decisionMakerEmail: "",
    openingHours: "Mo-Fr 09:00-18:00, Sa 09:00-14:00",
    lat: null,
    lon: null,
    score,
    leadQuality: q,
    leadQualityLabel: `${q}-Lead`,
    chainHint,
    status,
    lastContactedAt: status === "NEW" ? null : "2026-05-01T09:30:00.000Z",
    lastContactResult: status === "NEW" ? "Kein Kontakt" : "Erstkontakt erfolgt",
    contactCount: status === "NEW" ? 0 : 1,
    callNote: "",
    appointmentAt: status === "APPOINTMENT" ? "2026-05-09T14:00" : null,
    appointmentNote: "",
    internalNotes: "",
    impressumUrl: "",
    contactPageUrl: "",
    extractedEmails: [],
    extractedPhones: [],
    decisionMakerRole: "",
    createdAt: now,
    updatedAt: now
  };
};

export const mockLeads: Lead[] = [
  mk(1, "Bäckerei Schmitt", "Saarbrücken", "Bäckerei", "Mainzer Straße 86, 66121 Saarbrücken", "+49681123456", ["info@baeckerei-schmitt.de"], "https://baeckerei-schmitt.de", "Anna Schmitt", 94, "LOCAL", "INTERESTED"),
  mk(2, "Café am Schloss", "Saarbrücken", "Café", "Schlossplatz 4, 66119 Saarbrücken", "+49681555120", ["kontakt@cafe-am-schloss.de"], "https://cafe-am-schloss.de", "M. Weber", 87, "LOCAL"),
  mk(3, "Restaurant Zur Saar", "Saarlouis", "Restaurant", "Deutsche Straße 12, 66740 Saarlouis", "+496831778899", ["reservierung@zur-saar.de", "chef@zur-saar.de"], "https://zur-saar.de", "Thomas Klein", 91, "LOCAL", "APPOINTMENT"),
  mk(4, "Fitwerk Neunkirchen", "Neunkirchen", "Fitnessstudio", "Bliesstraße 21, 66538 Neunkirchen", "+496821998877", ["studio@fitwerk-nk.de"], "https://fitwerk-nk.de", "Sabrina Jung", 83, "LOCAL"),
  mk(5, "Salon Elise", "Homburg", "Friseur", "Talstraße 7, 66424 Homburg", "+496841445566", ["hello@salon-elise.de"], "https://salon-elise.de", "Elise Becker", 80, "LOCAL"),
  mk(6, "CleanCar Saarlouis", "Saarlouis", "Autowäsche", "Metzer Straße 55, 66740 Saarlouis", "+496831224466", ["service@cleancar-sl.de"], "https://cleancar-sl.de", "Serviceleitung", 70, "BRANCH"),
  mk(7, "Autohaus Merzig Werkstatt", "Merzig", "Werkstatt", "Losheimer Straße 33, 66663 Merzig", "+49686130220", ["werkstatt@auto-merzig.de"], "https://auto-merzig.de", "Peter Hoffmann", 89, "LOCAL", "CALLED"),
  mk(8, "Metzgerei Paulus", "St. Wendel", "Metzgerei", "Bahnhofstraße 15, 66606 St. Wendel", "+4968517788", ["info@metzgerei-paulus.de"], "https://metzgerei-paulus.de", "Familie Paulus", 92, "LOCAL"),
  mk(9, "Eiscafé Venezia", "Völklingen", "Eisdiele", "Rathausstraße 2, 66333 Völklingen", "+496898112233", ["venezia@eis-vk.de"], "https://eis-venezia-vk.de", "Luca Romano", 76, "LOCAL"),
  mk(10, "Radhaus Saar", "Saarbrücken", "Fahrradladen", "Dudweilerstraße 44, 66111 Saarbrücken", "+49681666777", ["team@radhaus-saar.de"], "https://radhaus-saar.de", "Jonas Krämer", 86, "LOCAL"),
  mk(11, "Backkultur Dillingen", "Dillingen", "Bäckerei", "Stummstraße 18, 66763 Dillingen", "+496831909090", ["kontakt@backkultur-dillingen.de"], "", "Claudia Maurer", 78, "LOCAL"),
  mk(12, "Café Petite", "Saarlouis", "Café", "Großer Markt 8, 66740 Saarlouis", "+496831556677", ["bonjour@cafe-petite.de"], "https://cafe-petite.de", "Nadine Simon", 84, "LOCAL", "INTERESTED"),
  mk(13, "Ristorante Milano", "Homburg", "Restaurant", "Kaiserstraße 45, 66424 Homburg", "+496841223344", ["info@milano-homburg.de"], "https://milano-homburg.de", "Marco Bianchi", 82, "LOCAL"),
  mk(14, "Athletic Base", "Saarbrücken", "Fitnessstudio", "Europaallee 19, 66113 Saarbrücken", "+496811909091", ["sales@athleticbase.de"], "https://athleticbase.de", "Lea Schuster", 90, "CHAIN"),
  mk(15, "Friseur König", "Merzig", "Friseur", "Trierer Straße 24, 66663 Merzig", "+496861665544", ["termin@friseur-koenig.de"], "https://friseur-koenig.de", "Ralf König", 69, "LOCAL"),
  mk(16, "Waschpark Blies", "St. Ingbert", "Autowäsche", "Saarbrücker Straße 101, 66386 St. Ingbert", "+496894334455", [], "https://waschpark-blies.de", "Betreiber", 64, "LOCAL"),
  mk(17, "KFZ Technik Lauer", "Neunkirchen", "Werkstatt", "Wellesweilerstraße 92, 66538 Neunkirchen", "+496821112244", ["info@kfz-lauer.de"], "https://kfz-lauer.de", "Dirk Lauer", 88, "LOCAL"),
  mk(18, "Metzgerei Alt", "Saarbrücken", "Metzgerei", "Burbacher Markt 3, 66115 Saarbrücken", "+49681777888", ["bestellung@metzgerei-alt.de"], "", "Andrea Alt", 74, "LOCAL"),
  mk(19, "Gelato Luna", "Saarlouis", "Eisdiele", "Sonnenstraße 6, 66740 Saarlouis", "+496831557799", ["ciao@gelato-luna.de"], "https://gelato-luna.de", "Giulia Ferri", 79, "LOCAL"),
  mk(20, "Velo Punkt", "Homburg", "Fahrradladen", "Ringstraße 9, 66424 Homburg", "+496841778899", ["service@velo-punkt.de"], "https://velo-punkt.de", "M. Bach", 85, "LOCAL"),
  mk(21, "Brotzeit Saar", "Neunkirchen", "Bäckerei", "Oberer Markt 1, 66538 Neunkirchen", "+496821443322", ["info@brotzeit-saar.de"], "https://brotzeit-saar.de", "Filialleitung", 81, "BRANCH"),
  mk(22, "Kaffeewerk Merzig", "Merzig", "Café", "Poststraße 11, 66663 Merzig", "+496861998811", ["kontakt@kaffeewerk-merzig.de"], "https://kaffeewerk-merzig.de", "Svenja Meier", 88, "LOCAL"),
  mk(23, "Gasthaus Linde", "St. Wendel", "Restaurant", "Luisenstraße 27, 66606 St. Wendel", "+496851334455", ["info@gasthaus-linde.de"], "", "Familie Braun", 73, "LOCAL"),
  mk(24, "Bodyline Saar", "Völklingen", "Fitnessstudio", "Karolingerstraße 77, 66333 Völklingen", "+496898887766", ["vk@bodyline.de"], "https://bodyline.de", "Studio Team", 67, "CHAIN"),
  mk(25, "Hairspace Saarlouis", "Saarlouis", "Friseur", "Lisdorfer Straße 22, 66740 Saarlouis", "+496831123321", ["mail@hairspace-sl.de"], "https://hairspace-sl.de", "Jasmin Roth", 71, "LOCAL"),
  mk(26, "Glanzpunkt Waschcenter", "Saarbrücken", "Autowäsche", "Lebacher Straße 190, 66113 Saarbrücken", "+496811222333", [], "https://glanzpunkt-waschcenter.de", "Centerleitung", 62, "LOCAL"),
  mk(27, "Garage Becker", "Dillingen", "Werkstatt", "Konrad-Adenauer-Allee 51, 66763 Dillingen", "+496831667788", ["kontakt@garage-becker.de"], "https://garage-becker.de", "Nico Becker", 86, "LOCAL", "NOT_REACHED"),
  mk(28, "Feinkost Metzgerei Stein", "Homburg", "Metzgerei", "Eisenbahnstraße 30, 66424 Homburg", "+496841889900", ["info@metzgerei-stein.de"], "https://metzgerei-stein.de", "Petra Stein", 93, "LOCAL"),
  mk(29, "Eiswerk Saar", "St. Ingbert", "Eisdiele", "Kaiserstraße 65, 66386 St. Ingbert", "+496894889977", ["info@eiswerk-saar.de"], "https://eiswerk-saar.de", "Alessio Conti", 77, "LOCAL"),
  mk(30, "Bike Station Saar", "Saarbrücken", "Fahrradladen", "Futterstraße 14, 66111 Saarbrücken", "+49681501010", ["shop@bikestation-saar.de"], "https://bikestation-saar.de", "Team Verkauf", 89, "BRANCH", "PARTNER")
];
