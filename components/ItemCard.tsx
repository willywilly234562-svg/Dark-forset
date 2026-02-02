import React from 'react';
import { Item, ItemRarity, ItemType } from '../types';
import { Sword, Shield, Gem, Coins, Flame } from 'lucide-react';

interface ItemCardProps {
  item: Item;
  onEquip?: (item: Item) => void;
  onSell?: (item: Item) => void;
  isEquipped?: boolean;
  displayValue?: number;
}

const rarityColors = {
  [ItemRarity.COMMON]: 'border-slate-500 bg-slate-800 text-slate-300',
  [ItemRarity.RARE]: 'border-blue-500 bg-blue-900/20 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.3)]',
  [ItemRarity.EPIC]: 'border-purple-500 bg-purple-900/20 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.4)]',
  [ItemRarity.LEGENDARY]: 'border-amber-500 bg-amber-900/20 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse-slow',
  [ItemRarity.MYTHIC]: 'border-red-600 bg-red-950/40 text-red-100 shadow-[0_0_30px_rgba(220,38,38,0.6)] animate-pulse border-2',
};

const isConsumable = (item: Item) => {
  if (item.id === 'potion-red' || item.id === 'elixir-vitality') return true;
  if (item.name === 'Health Potion' || item.name === 'Elixir of Vitality') return true;
  return false;
};

const ItemCard: React.FC<ItemCardProps> = ({ item, onEquip, onSell, isEquipped, displayValue }) => {
  const Icon = item.type === ItemType.WEAPON ? Sword : item.type === ItemType.ARMOR ? Shield : Gem;
  const isMythic = item.rarity === ItemRarity.MYTHIC;
  const canEquip = Boolean(onEquip) && !isEquipped && !isConsumable(item);
  const valueToShow = displayValue ?? item.value;
  const attackValue = item.stats.attack ?? 0;
  const defenseValue = item.stats.defense ?? 0;
  const hpValue = item.stats.hpBonus ?? 0;
  const hasStats = attackValue > 0 || defenseValue > 0 || hpValue > 0;

  return (
    <div className={`relative p-2 rounded-md border-2 flex flex-col gap-1.5 transition-transform hover:scale-[1.02] ${rarityColors[item.rarity]}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-1.5">
          {isMythic ? <Flame size={16} className="text-red-500 animate-bounce" /> : <Icon size={16} />}
          <h4 className={`font-bold text-[13px] cinzel ${isMythic ? 'text-red-400 drop-shadow-[0_0_5px_rgba(255,0,0,0.8)]' : ''}`}>
            {item.name}
          </h4>
        </div>
        {isEquipped && <span className="text-[9px] uppercase font-bold bg-green-900 text-green-300 px-1 rounded">Equipped</span>}
      </div>
      
      <p className="text-[11px] italic opacity-80 leading-snug min-h-[2em]">{item.description}</p>
      
      {hasStats && (
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px]">
          {attackValue > 0 && <span className="text-red-300">ATK +{attackValue}</span>}
          {defenseValue > 0 && <span className="text-blue-300">DEF +{defenseValue}</span>}
          {hpValue > 0 && <span className="text-green-300">HP +{hpValue}</span>}
        </div>
      )}

      <div className="mt-auto flex justify-between items-center pt-1.5 border-t border-white/10">
        <span className="flex items-center gap-1 text-[11px] text-yellow-500">
            <Coins size={11} /> {valueToShow}
        </span>
        <div className="flex gap-1.5">
            {canEquip && (
                <button 
                    onClick={() => onEquip?.(item)}
                    className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 rounded text-[11px] font-bold transition-colors"
                >
                    Equip
                </button>
            )}
            {onSell && (
                <button 
                    onClick={() => onSell(item)}
                    className="px-2 py-0.5 bg-red-900/50 hover:bg-red-900/80 rounded text-[11px] font-bold text-red-200 transition-colors"
                >
                    Sell
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
