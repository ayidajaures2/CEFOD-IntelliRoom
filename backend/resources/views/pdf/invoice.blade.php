<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Facture {{ $facture->numero_facture }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 14px; }
        .header { text-align: center; border-bottom: 2px solid #f97316; padding-bottom: 20px; }
        .header h1 { color: #f97316; margin: 0; }
        .info { margin: 20px 0; }
        .info table { width: 100%; }
        .info td { padding: 5px; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th { background: #f97316; color: white; padding: 10px; text-align: left; }
        .table td { padding: 10px; border-bottom: 1px solid #ddd; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #888; }
        .badge { background: #f97316; color: white; padding: 3px 10px; border-radius: 12px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>CEFOD IntelliRoom</h1>
        <p>Facture #{{ $facture->numero_facture }}</p>
    </div>

    <div class="info">
        <table>
            <tr>
                <td><strong>Client :</strong> {{ $client->prenom }} {{ $client->nom }}</td>
                <td><strong>Email :</strong> {{ $client->email }}</td>
            </tr>
            <tr>
                <td><strong>Téléphone :</strong> {{ $client->telephone ?? 'Non renseigné' }}</td>
                <td><strong>Date :</strong> {{ $facture->date_emission->format('d/m/Y H:i') }}</td>
            </tr>
        </table>
    </div>

    <h3>Détails de la réservation</h3>
    <table class="table">
        <thead>
            <tr>
                <th>Description</th>
                <th>Détails</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Salle</strong></td>
                <td>{{ $salle->nom_salle ?? $salle->libelle_salle }}</td>
            </tr>
            <tr>
                <td><strong>Type</strong></td>
                <td>{{ $salle->type_salle ?? $salle->type }}</td>
            </tr>
            <tr>
                <td><strong>Capacité</strong></td>
                <td>{{ $salle->capacite }} places</td>
            </tr>
            <tr>
                <td><strong>Date de début</strong></td>
                <td>{{ $reservation->date_debut->format('d/m/Y H:i') }}</td>
            </tr>
            <tr>
                <td><strong>Date de fin</strong></td>
                <td>{{ $reservation->date_fin->format('d/m/Y H:i') }}</td>
            </tr>
            <tr>
                <td><strong>Motif</strong></td>
                <td>{{ $reservation->motif ?? 'Non précisé' }}</td>
            </tr>
        </tbody>
    </table>

    <h3>Paiement</h3>
    <table class="table">
        <thead>
            <tr>
                <th>Mode</th>
                <th>Montant</th>
                <th>Statut</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $paiement->mode_paiement === 'especes' ? 'Espèces' : 'Mobile Money' }}</td>
                <td><strong>{{ number_format($paiement->montant, 0, ',', ' ') }} FCFA</strong></td>
                <td><span class="badge">Payé</span></td>
            </tr>
        </tbody>
    </table>

    <div class="total">
        Total : {{ number_format($paiement->montant, 0, ',', ' ') }} FCFA
    </div>

    <div class="footer">
        <p>CEFOD IntelliRoom - {{ date('Y') }}</p>
        <p>Merci de votre confiance</p>
    </div>
</body>
</html>