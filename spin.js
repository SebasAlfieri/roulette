// 0 - STD
// 1 - NO-0
// 2 - SEL
// 3 - PROB
var SpinMode = 0;

var SpinState;
var Spinning = false;
var SpinRnd = 0;
var SpinStop = 1000000;
var SpinEnd = 58;

var SpinDir = 1;

var SpinHistN = 12;
var SpinHist = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];

var SpinDebug = false;

// Auto-spin and Martingala mode variables
var AutoSpinMode = 0; // 0 = off, 1 = auto-spin, 2 = martingala, 3 = martingala x2
var AutoSpinTimer = null;
var MartingalaTimer = null;
var MartingalaX2Timer = null;
var RepaintTimer = null; // Timer to refresh display continuously
var MartingalaInitialBet = 0;
var MartingalaCurrentBet = 0;
var MartingalaActive = false;
var MartingalaX2Active = false;
var MartingalaBets = []; // Store initial bets for martingala
var ExecutingMartingala = false;

// Auto/Martingala counting variables
var AutoMartingalaSpinCount = 0; // Count of spins during auto/martingala mode
var AutoMartingalaNegativeCount = 0; // Count of times balance went negative
var LastBalanceWasPositive = true; // Track previous balance state to detect transitions

function Spin()
{
    if (GameType == 0)
    {
        SpinEnd = 58;
    }
    if (GameType == 1)
    {
        SpinEnd = 53;
    }
    if (GameType == 2)
    {
        SpinEnd = 55;
    }

    if (SpinMode == 3)
    {
        if (ProbMode)
        {
            ProbMode = false;
        }
        else
        {
            ProbMode = true;
        }
        StateSave();
        ProbCalc();
        ProbRepaint0();
        return;
    }

    if (Spinning)
    {
        return;
    }

    SpinDebug = true;

    for (var I = 0; I < GamePlayer_C; I++)
    {
        GamePlayer_[I].MoveSectorBets(false);
    }

    if (PlayerSelected())
    {
        GamePlayer_[GamePlayer_N].WheelNeighLastS = -1;
    }

    var ZeroField = -10000;

    if (SpinMode == 1)
    {
        if (SpinDir > 0)
        {
            ZeroField = WheelPos;
        }
        if (SpinDir < 0)
        {
            ZeroField = WheelNumCount - WheelPos;
            if (ZeroField == WheelNumCount)
            {
                ZeroField = 0;
            }
        }
    }

    Spinning = true;
    SpinState = 0;
    if (SpinMode != 2)
    {
        SpinRnd = ZeroField;
        if (GameType != 2)
        {
            while (SpinRnd == ZeroField)
            {
                SpinRnd = GetRandom(0, WheelNumCount - 1);
            }
        }
        else
        {
            var SpinWorkRnd = true;
            while (SpinWorkRnd)
            {
                SpinRnd = GetRandom(0, WheelNumCount - 1);
                SpinWorkRnd = (SpinRnd == ZeroField);
                SpinWorkRnd = SpinWorkRnd || (SpinRnd == (ZeroField + 21)) || (SpinRnd == (ZeroField + 42));
                SpinWorkRnd = SpinWorkRnd || (SpinRnd == (ZeroField + 63)) || (SpinRnd == (ZeroField + 84));
                SpinWorkRnd = SpinWorkRnd || (SpinRnd == (ZeroField - 21)) || (SpinRnd == (ZeroField - 42));
                SpinWorkRnd = SpinWorkRnd || (SpinRnd == (ZeroField - 63)) || (SpinRnd == (ZeroField - 84));
            }
        }
    }
    if (SpinDebug)
    {
        SpinT();
    }
    else
    {
        setTimeout(function(){ SpinT() }, 100);
    }
}

function GetRandom(min, max)
{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function SpinT()
{
    if (SpinMode == 2)
    {
        if (SpinState < SpinStop)
        {
            WheelPos -= SpinDir;
        }
        else
        {
            WheelPosT = WheelPos;
            SpinHistory();
        }
    }
    else
    {
        AngleOffsetI += SpinDir;
        if (AngleOffsetI >= (WheelNumCount * 2))
        {
            AngleOffsetI = 0;
        }
        if (AngleOffsetI < 0)
        {
            AngleOffsetI = (WheelNumCount * 2) - 1;
        }

        if (GameType != 2)
        {
            if ((SpinState >= 10) && (SpinState < 20))
            {
                WheelPos -= (5 * SpinDir);
            }
            if ((SpinState >= 20) && (SpinState < 30))
            {
                WheelPos -= (4 * SpinDir);
            }
            if ((SpinState >= 30) && (SpinState < 40))
            {
                WheelPos -= (3 * SpinDir);
            }
            if ((SpinState >= 40) && (SpinState < 50))
            {
                WheelPos -= (2 * SpinDir);
            }
            if ((SpinState >= 50) && (SpinState < (SpinEnd + SpinRnd)))
            {
                WheelPos -= (1 * SpinDir);
            }
        }
        if (GameType == 2)
        {
            if ((SpinState >= 10) && (SpinState < 20))
            {
                WheelPos -= (4 * SpinDir);
            }
            if ((SpinState >= 20) && (SpinState < 30))
            {
                WheelPos -= (3 * SpinDir);
            }
            if ((SpinState >= 30) && (SpinState < 40))
            {
                WheelPos -= (2 * SpinDir);
            }
            if ((SpinState >= 40) && (SpinState < (SpinEnd + SpinRnd)))
            {
                WheelPos -= (1 * SpinDir);
            }
        }
        SpinState++;
    }

    while (WheelPos < 0)
    {
        WheelPos += WheelNumCount;
    }
    while (WheelPos >= WheelNumCount)
    {
        WheelPos -= WheelNumCount;
    }
    SetWheelSplitPos(WheelPos);
    if ((SpinState == (SpinEnd + SpinRnd)))
    {
        WheelPosT = WheelPos;
        SpinHistory();
        PaintTable();
    }
    if (!SpinDebug)
    {
        PaintWheel();
    }

    if ((SpinState <= (SpinEnd + 10 + SpinRnd)))
    {
        if (SpinDebug)
        {
            SpinT();
        }
        else
        {
            setTimeout(function(){ SpinT() }, 100);
        }
    }
    else
    {
        if (SpinDebug)
        {
            console.log(WheelNums[WheelPosT]);
        }
        UpdateStats(WheelNums[WheelPosT]);
        for (var I = 0; I < GamePlayer_C; I++)
        {
            GamePlayer_[I].Account(WheelNums[WheelPosT], false);
            StatePlayerSave_(I);
        }
        StateSave();
        
        // Count spins and negative balance for AutoSpin mode
        if (AutoSpinMode == 1 && PlayerSelected())
        {
            AutoMartingalaSpinCount++;
            // Only count when transitioning from positive to negative
            var CurrentIsNegative = GamePlayer_[GamePlayer_N].Amount < 0;
            if (CurrentIsNegative && LastBalanceWasPositive)
            {
                AutoMartingalaNegativeCount++;
            }
            LastBalanceWasPositive = !CurrentIsNegative;
        }
        
        Spinning = false;
        ProbCalc();
        PaintPlayerList();
        PaintCurrentPlayer();
        PaintTable();
        PaintWheel();
    }
}

function SpinHistory()
{
    for (var I = SpinHistN - 2; I >= 0; I--)
    {
        SpinHist[I + 1] = SpinHist[I];
    }
    SpinHist[0] = WheelNums[WheelPosT];
}

function StartAutoSpin()
{
    if (AutoSpinMode == 1 && PlayerSelected() && GamePlayer_[GamePlayer_N].BetList.length > 0)
    {
        if (!Spinning && AutoSpinTimer == null)
        {
            // Reset counters when starting auto spin
            AutoMartingalaSpinCount = 0;
            AutoMartingalaNegativeCount = 0;
            LastBalanceWasPositive = GamePlayer_[GamePlayer_N].Amount >= 0;
            
            // Start continuous repaint timer
            if (RepaintTimer == null)
            {
                RepaintTimer = setInterval(function() {
                    if (AutoSpinMode >= 1)
                    {
                        PaintGame();
                    }
                }, 100);
            }
            
            Spin();
            AutoSpinTimer = setInterval(function() {
                if (!Spinning && AutoSpinMode == 1 && PlayerSelected())
                {
                    Spin();
                }
            }, 100);
        }
    }
}

function StopAutoSpin()
{
    if (AutoSpinTimer != null)
    {
        clearInterval(AutoSpinTimer);
        AutoSpinTimer = null;
    }
    if (MartingalaTimer != null)
    {
        clearInterval(MartingalaTimer);
        MartingalaTimer = null;
    }
    if (MartingalaX2Timer != null)
    {
        clearInterval(MartingalaX2Timer);
        MartingalaX2Timer = null;
    }
    if (RepaintTimer != null)
    {
        clearInterval(RepaintTimer);
        RepaintTimer = null;
    }
    // Reset counters when stopping
    AutoMartingalaSpinCount = 0;
    AutoMartingalaNegativeCount = 0;
}

function StartMartingala()
{
    if (AutoSpinMode == 2 && PlayerSelected() && GamePlayer_[GamePlayer_N].BetList.length > 0)
    {
        if (!MartingalaActive)
        {
            // Reset counters when starting martingala
            AutoMartingalaSpinCount = 0;
            AutoMartingalaNegativeCount = 0;
            LastBalanceWasPositive = GamePlayer_[GamePlayer_N].Amount >= 0; // ← FIX

            // Start continuous repaint timer
            if (RepaintTimer == null)
            {
                RepaintTimer = setInterval(function() {
                    if (AutoSpinMode >= 1)
                    {
                        PaintGame();
                    }
                }, 100);
            }

            MartingalaActive = true;
            MartingalaInitialBet = GamePlayer_[GamePlayer_N].AmountT;
            MartingalaCurrentBet = MartingalaInitialBet;

            // Save the initial bets structure for later restoration
            MartingalaBets = [];
            for (var I = 0; I < GamePlayer_[GamePlayer_N].BetList.length; I++)
            {
                var BetItem = GamePlayer_[GamePlayer_N].BetList[I];
                MartingalaBets.push([BetItem[0], BetItem[1], BetItem[2], BetItem[3], BetItem[4], BetItem[5], BetItem[6], BetItem[7]]);
            }

            if (!Spinning && MartingalaTimer == null)
            {
                Spin();
                MartingalaTimer = setInterval(function() {
                    if (!Spinning && AutoSpinMode == 2 && PlayerSelected() && MartingalaActive)
                    {
                        ExecuteMartingala();
                    }
                }, 500);
            }
        }
    }
}
function StartMartingalaX2()
{
    if (AutoSpinMode == 3 && PlayerSelected() && GamePlayer_[GamePlayer_N].BetList.length > 0)
    {
        if (!MartingalaX2Active)
        {
            // Reset counters when starting martingala x2
            AutoMartingalaSpinCount = 0;
            AutoMartingalaNegativeCount = 0;
            LastBalanceWasPositive = GamePlayer_[GamePlayer_N].Amount >= 0; // ← FIX

            // Start continuous repaint timer
            if (RepaintTimer == null)
            {
                RepaintTimer = setInterval(function() {
                    if (AutoSpinMode >= 1)
                    {
                        PaintGame();
                    }
                }, 100);
            }

            MartingalaX2Active = true;
            // Store initial bet values from current bets
            MartingalaInitialBet = GamePlayer_[GamePlayer_N].AmountT;
            MartingalaCurrentBet = MartingalaInitialBet;

            // Save the initial bets structure for later restoration
            MartingalaBets = [];
            for (var I = 0; I < GamePlayer_[GamePlayer_N].BetList.length; I++)
            {
                var BetItem = GamePlayer_[GamePlayer_N].BetList[I];
                MartingalaBets.push([BetItem[0], BetItem[1], BetItem[2], BetItem[3], BetItem[4], BetItem[5], BetItem[6], BetItem[7]]);
            }

            if (!Spinning && MartingalaX2Timer == null)
            {
                Spin();
                MartingalaX2Timer = setInterval(function() {
                    if (!Spinning && AutoSpinMode == 3 && PlayerSelected() && MartingalaX2Active)
                    {
                        // Execute Martingala logic
                        ExecuteMartingala();
                    }
                }, 100);
            }
        }
    }
}

function StopMartingala()
{
    if (MartingalaTimer != null)
    {
        clearInterval(MartingalaTimer);
        MartingalaTimer = null;
    }
    if (RepaintTimer != null)
    {
        clearInterval(RepaintTimer);
        RepaintTimer = null;
    }
    MartingalaActive = false;
    MartingalaInitialBet = 0;
    MartingalaCurrentBet = 0;
    MartingalaBets = [];
    AutoMartingalaSpinCount = 0;
    AutoMartingalaNegativeCount = 0;
    ExecutingMartingala = false; // ← FIX
}

function StopMartingalaX2()
{
    if (MartingalaX2Timer != null)
    {
        clearInterval(MartingalaX2Timer);
        MartingalaX2Timer = null;
    }
    if (RepaintTimer != null)
    {
        clearInterval(RepaintTimer);
        RepaintTimer = null;
    }
    MartingalaX2Active = false;
    MartingalaInitialBet = 0;
    MartingalaCurrentBet = 0;
    MartingalaBets = [];
    AutoMartingalaSpinCount = 0;
    AutoMartingalaNegativeCount = 0;
    ExecutingMartingala = false; // ← FIX
}

function ExecuteMartingala()
{
    if (Spinning) return;
    if (ExecutingMartingala) return; // ← FIX: bloqueo propio
    ExecutingMartingala = true;     // ← FIX: activar bloqueo

    if (!PlayerSelected() || GamePlayer_[GamePlayer_N].BetList.length == 0 || MartingalaBets.length == 0)
    {
        StopMartingala();
        StopMartingalaX2();
        AutoSpinMode = 0;
        PaintGame();
        ExecutingMartingala = false; // ← FIX: liberar antes de salir
        return;
    }

    AutoMartingalaSpinCount++;

    var CurrentIsNegative = GamePlayer_[GamePlayer_N].Amount < 0;
    if (CurrentIsNegative && LastBalanceWasPositive)
    {
        AutoMartingalaNegativeCount++;
    }
    LastBalanceWasPositive = !CurrentIsNegative;

    var LastResult = GamePlayer_[GamePlayer_N].AmountLast;

    if (LastResult < 0)
    {
        GamePlayer_[GamePlayer_N].DoubleBets();
        MartingalaCurrentBet = GamePlayer_[GamePlayer_N].AmountT;
    }
    else if (LastResult >= 0)
    {
        GamePlayer_[GamePlayer_N].BetList = [];
        GamePlayer_[GamePlayer_N].AmountT = 0;

        for (var I = 0; I < MartingalaBets.length; I++)
        {
            var BetItem = MartingalaBets[I];
            GamePlayer_[GamePlayer_N].BetList.push([BetItem[0], BetItem[1], BetItem[2], BetItem[3], BetItem[4], BetItem[5], BetItem[6], BetItem[7]]);
            GamePlayer_[GamePlayer_N].AmountT += BetItem[7];
        }

        MartingalaCurrentBet = MartingalaInitialBet;
    }

    StatePlayerSave(false);
    ExecutingMartingala = false; // ← FIX: liberar antes del spin
    Spin();
}