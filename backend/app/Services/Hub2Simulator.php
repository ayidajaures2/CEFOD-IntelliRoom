<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class Hub2Simulator
{
    /**
     * Configuration des frais pour le TCHAD
     * Opérateurs disponibles : Airtel Money & Moov Money
     */
    private static $operators = [
        'airtel_money' => [
            'TD' => ['rate' => 1.8, 'min' => 50, 'max' => 3000],
            'default' => ['rate' => 2.0, 'min' => 50, 'max' => 3000],
        ],
        'moov_money' => [
            'TD' => ['rate' => 1.6, 'min' => 40, 'max' => 2500],
            'default' => ['rate' => 1.8, 'min' => 50, 'max' => 3000],
        ],
    ];

    /**
     * Détecter le pays (Tchad par défaut)
     */
    private static function detectCountry($telephone)
    {
        $phone = preg_replace('/[^0-9]/', '', $telephone);
        
        // Tchad : indicatif +235
        if (strpos($phone, '235') === 0 || strpos($phone, '235') !== false) {
            return 'TD';
        }
        
        return 'TD';
    }

    /**
     * Récupérer la configuration de l'opérateur
     */
    private static function getOperatorConfig($operator, $country)
    {
        if (!isset(self::$operators[$operator])) {
            return ['rate' => 2.0, 'min' => 50, 'max' => 3000];
        }
        
        $operatorConfig = self::$operators[$operator];
        
        if (isset($operatorConfig[$country])) {
            return $operatorConfig[$country];
        }
        
        return $operatorConfig['default'] ?? ['rate' => 2.0, 'min' => 50, 'max' => 3000];
    }

    /**
     * Calculer les frais selon la config
     */
    private static function calculateFees($montant, $config)
    {
        $rate = $config['rate'] ?? 2.0;
        $min = $config['min'] ?? 0;
        $max = $config['max'] ?? 999999;
        
        // Calcul basé sur le taux
        $amount = $montant * ($rate / 100);
        
        // Arrondir à l'entier supérieur
        $amount = ceil($amount);
        
        // Appliquer les min/max
        $amount = max($min, min($amount, $max));
        
        // Arrondir au multiple de 5 (comme HUB2)
        $amount = ceil($amount / 5) * 5;
        
        return [
            'rate' => $rate,
            'amount' => $amount,
            'taxes' => [],
        ];
    }

    /**
     * Simuler un paiement HUB2 - Version Tchad
     */
    public static function simulateTransfer($montant, $mode_paiement, $telephone)
    {
        $pays = self::detectCountry($telephone);
        $operatorConfig = self::getOperatorConfig($mode_paiement, $pays);
        
        $fraisData = self::calculateFees($montant, $operatorConfig);
        
        // Transaction ID simulé (format HUB2)
        $transactionId = 'HUB2-SIM-' . time() . '-' . strtoupper(substr(uniqid(), -6));
        
        return [
            'success' => true,
            'data' => [
                'id' => $transactionId,
                'status' => 'succeeded',
                'amount' => $montant,
                'currency' => 'XOF',
                'payment_method' => 'mobile_money',
                'operator' => $mode_paiement,
                'phone' => $telephone,
                'country' => 'Tchad',
                'country_code' => 'TD',
                'fees' => [
                    [
                        'id' => 'fee_' . time(),
                        'rate' => $fraisData['rate'],
                        'type' => 'percent',
                        'amount' => $fraisData['amount'],
                        'currency' => 'XOF',
                        'label' => 'Frais de transaction',
                        'taxes' => $fraisData['taxes'] ?? [],
                    ]
                ],
                'created_at' => now()->toISOString(),
                'completed_at' => now()->toISOString(),
            ]
        ];
    }

    /**
     * Obtenir le libellé d'un opérateur
     */
    public static function getOperatorLabel($operator)
    {
        $labels = [
            'airtel_money' => 'Airtel Money',
            'moov_money' => 'Moov Money',
        ];
        
        return $labels[$operator] ?? $operator;
    }

    /**
     * Obtenir la liste des opérateurs pour le Tchad
     */
    public static function getOperators()
    {
        return [
            'airtel_money' => 'Airtel Money',
            'moov_money' => 'Moov Money',
        ];
    }
}