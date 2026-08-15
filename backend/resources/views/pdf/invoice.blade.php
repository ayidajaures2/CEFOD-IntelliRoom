<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Facture {{ $facture->numero_facture }}</title>
<style>
    /* DomPDF a un support CSS limité : on reste sur des tables et des
       styles simples, pas de flexbox/grid. */
    * { box-sizing: border-box; }
    body {
        font-family: DejaVu Sans, sans-serif;
        font-size: 11px;
        color: #1a1a1a;
        margin: 0;
        padding: 0;
    }
    .page { padding: 24px 28px; }

    /* ---------- En-tête ---------- */
    table.header-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    table.header-table td { vertical-align: top; }
    .logo-cell { width: 60%; }
    .cefod-name { font-size: 18px; font-weight: bold; letter-spacing: 1px; }
    .cefod-infos { font-size: 9.5px; color: #444; line-height: 1.5; margin-top: 4px; }
    .facture-title-cell { width: 40%; text-align: right; }
    .facture-title { font-size: 13px; font-weight: bold; }
    .facture-numero { font-size: 11px; margin-top: 2px; }
    .facture-date { font-size: 10px; color: #444; margin-top: 6px; }

    hr.sep { border: none; border-top: 2px solid #1a1a1a; margin: 10px 0 16px; }

    /* ---------- Bloc client / commande ---------- */
    table.client-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    table.client-table td {
        padding: 3px 0;
        font-size: 10.5px;
        vertical-align: top;
    }
    .client-label { width: 130px; color: #555; }
    .client-value { font-weight: bold; }

    /* ---------- Tableau des lignes ---------- */
    table.lignes-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
    table.lignes-table th {
        background: #1a1a1a;
        color: #fff;
        font-size: 9.5px;
        text-transform: uppercase;
        padding: 6px 5px;
        text-align: left;
    }
    table.lignes-table th.num, table.lignes-table td.num { text-align: right; }
    table.lignes-table td {
        font-size: 10px;
        padding: 6px 5px;
        border-bottom: 1px solid #ddd;
    }
    table.lignes-table tr:nth-child(even) td { background: #f7f7f7; }

    /* ---------- Totaux ---------- */
    table.totaux-table { width: 260px; margin-left: auto; margin-top: 10px; border-collapse: collapse; }
    table.totaux-table td { padding: 4px 6px; font-size: 10.5px; }
    table.totaux-table td.label { color: #555; }
    table.totaux-table td.value { text-align: right; }
    table.totaux-table tr.total-final td {
        border-top: 2px solid #1a1a1a;
        font-weight: bold;
        font-size: 12px;
        padding-top: 7px;
    }

    /* ---------- Bas de page ---------- */
    .arrete { margin-top: 22px; font-size: 10.5px; font-style: italic; }

    table.footer-table { width: 100%; border-collapse: collapse; margin-top: 26px; }
    table.footer-table td { vertical-align: top; font-size: 9px; }
    .bank-cell { width: 60%; color: #444; line-height: 1.6; }
    .bank-title { font-weight: bold; color: #1a1a1a; font-size: 9.5px; margin-bottom: 3px; }
    .signature-cell { width: 40%; text-align: center; }
    .signature-label { font-size: 10px; margin-bottom: 30px; }
    .signature-line { border-top: 1px solid #999; width: 160px; margin: 0 auto; padding-top: 4px; font-size: 9.5px; }

    .badge-mode {
        display: inline-block;
        font-size: 8.5px;
        padding: 2px 6px;
        border: 1px solid #999;
        border-radius: 3px;
        color: #555;
    }
</style>
</head>
<body>
<div class="page">

    {{-- ================= EN-TÊTE ================= --}}
    <table class="header-table">
        <tr>
            <td class="logo-cell">
                <div class="cefod-name">CEFOD</div>
                <div class="cefod-infos">
                    BP 907 N'Djamena — Tchad<br>
                    Téléphone : (235) 22 51 71 42 &nbsp;·&nbsp; Télécopie : (235) 22 51 91 50<br>
                    NIF : 5001672Z
                </div>
            </td>
            <td class="facture-title-cell">
                <div class="facture-title">FACTURE</div>
                <div class="facture-numero">N° {{ $facture->numero_facture }}</div>
                <div class="facture-date">
                    Date d'émission : {{ optional($facture->date_emission)->format('d/m/Y') }}
                </div>
            </td>
        </tr>
    </table>

    <hr class="sep">

    {{-- ================= CLIENT / COMMANDE ================= --}}
    <table class="client-table">
        <tr>
            <td class="client-label">Nom / Structure</td>
            <td class="client-value">
                {{ $facture->responsable_client ?? trim(($client->nom ?? '') . ' ' . ($client->prenom ?? '')) }}
            </td>
            <td class="client-label">Réf. commande</td>
            <td class="client-value">{{ $facture->ref_commande ?? '—' }}</td>
        </tr>
        <tr>
            <td class="client-label">Téléphone</td>
            <td class="client-value">{{ $client->telephone ?? '—' }}</td>
            <td class="client-label">Salle réservée</td>
            <td class="client-value">{{ $salle->nom_salle ?? '—' }}</td>
        </tr>
        <tr>
            <td class="client-label">Email</td>
            <td class="client-value">{{ $client->email ?? '—' }}</td>
            <td class="client-label">Mode de paiement</td>
            <td class="client-value">
                <span class="badge-mode">{{ strtoupper(str_replace('_', ' ', $paiement->mode_paiement ?? '—')) }}</span>
            </td>
        </tr>
        @if($reservation)
        <tr>
            <td class="client-label">Créneau</td>
            <td class="client-value" colspan="3">
                Du {{ optional($reservation->date_debut)->format('d/m/Y à H:i') }}
                au {{ optional($reservation->date_fin)->format('d/m/Y à H:i') }}
            </td>
        </tr>
        @endif
    </table>

    {{-- ================= LIGNES DE FACTURE ================= --}}
    <table class="lignes-table">
        <thead>
            <tr>
                <th style="width: 12%;">Référence</th>
                <th style="width: 10%;" class="num">Quantité</th>
                <th style="width: 38%;">Description</th>
                <th style="width: 12%;">Code TVA</th>
                <th style="width: 14%;" class="num">P.U. (FCFA)</th>
                <th style="width: 14%;" class="num">Montant (FCFA)</th>
            </tr>
        </thead>
        <tbody>
            @forelse($lignes as $ligne)
            <tr>
                <td>{{ $ligne->reference ?? '—' }}</td>
                <td class="num">{{ rtrim(rtrim(number_format($ligne->quantite, 2, ',', ' '), '0'), ',') }}</td>
                <td>{{ $ligne->description }}</td>
                <td>{{ $ligne->code_tva ?? '—' }}</td>
                <td class="num">{{ number_format($ligne->prix_unitaire, 0, ',', ' ') }}</td>
                <td class="num">{{ number_format($ligne->montant, 0, ',', ' ') }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="6" style="text-align:center; color:#888;">Aucune ligne enregistrée pour cette facture.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    {{-- ================= TOTAUX ================= --}}
    <table class="totaux-table">
        <tr>
            <td class="label">Net à payer</td>
            <td class="value">{{ number_format($facture->net_a_payer, 0, ',', ' ') }} FCFA</td>
        </tr>
        <tr>
            <td class="label">Frais de livraison</td>
            <td class="value">{{ number_format($facture->frais_livraison, 0, ',', ' ') }} FCFA</td>
        </tr>
        <tr>
            <td class="label">Remise</td>
            <td class="value">{{ number_format($facture->taux_remise, 2, ',', ' ') }} %</td>
        </tr>
        <tr class="total-final">
            <td class="label">Total T.T.C.</td>
            <td class="value">{{ number_format($facture->total_ttc, 0, ',', ' ') }} FCFA</td>
        </tr>
    </table>

    <div class="arrete">
        Arrêté la présente facture à la somme de
        <strong>{{ number_format($facture->total_ttc, 0, ',', ' ') }} francs CFA</strong>.
    </div>

    {{-- ================= PIED DE PAGE ================= --}}
    <table class="footer-table">
        <tr>
            <td class="bank-cell">
                <div class="bank-title">Coordonnées bancaires</div>
                Titulaire : CEFOD &nbsp;·&nbsp; Banque : ORABANK TCHAD<br>
                Code interbancaire : 60006 &nbsp;·&nbsp; Clé RIB : 28 &nbsp;·&nbsp; Code guichet : 01001<br>
                Numéro de compte : 00028700189<br>
                IBAN : TD8960000901001000289920<br>
                Code BIC : ORABTDND &nbsp;·&nbsp; Domiciliation : N'Djamena
            </td>
            <td class="signature-cell">
                <div class="signature-label">
                    Facture {{ $facture->mode_generation === 'manuelle' ? 'validée par la comptabilité' : 'générée automatiquement' }}
                </div>
                <div class="signature-line">
                    {{ optional($facture->comptable)->prenom }} {{ optional($facture->comptable)->nom }}
                    @if(!$facture->comptable)
                        Comptabilité — CEFOD
                    @endif
                </div>
            </td>
        </tr>
    </table>

</div>
</body>
</html>