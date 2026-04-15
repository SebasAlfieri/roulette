// Estadísticas de la ruleta
var NumberStats = {};
var TotalSpins = 0;
var PlayerBalanceHistory = {};  // Historial de balances por jugador
var SpinCounterForBalance = 0;  // Contador para registrar cada 10 jugadas

// Variables para rastrear secuencias de colores consecutivos (cualquier color, sin distinguir rojo/negro)
var ColorHistory = [];  // Historial de colores recientes
var ColorStreakCounts = {};  // Contador de secuencias (1-15)
var LastColorStreak = {color: null, count: 0};  // Rastreo de secuencia actual

function InitStats()
{
    // Inicializar contador para cada número solo si no existen
    for (var I = 0; I <= 100; I++)
    {
        if (NumberStats[I] === undefined)
        {
            NumberStats[I] = 0;
        }
    }
    
    // Inicializar contadores de secuencias de colores
    for (var I = 1; I <= 15; I++)
    {
        if (ColorStreakCounts[I] === undefined)
        {
            ColorStreakCounts[I] = 0;
        }
    }
}

function ClearStats()
{
    // Confirmar antes de limpiar
    if (!confirm("¿Estás seguro de que deseas limpiar todas las estadísticas? Esta acción no se puede deshacer."))
    {
        return;
    }
    
    // Limpiar todas las estadísticas
    NumberStats = {};
    TotalSpins = 0;
    PlayerBalanceHistory = {};
    SpinCounterForBalance = 0;
    ColorHistory = [];
    ColorStreakCounts = {};
    LastColorStreak = {color: null, count: 0};
    
    // Reinicializar contadores de secuencias de colores
    for (var I = 1; I <= 15; I++)
    {
        ColorStreakCounts[I] = 0;
    }
    
    // Inicializar contador para cada número
    for (var I = 0; I <= 100; I++)
    {
        NumberStats[I] = 0;
    }
    
    // Guardar cambios en almacenamiento
    StatsSave();
    
    // Cerrar pantalla de estadísticas y mostrar mensaje
    StatsClose();
    alert("Las estadísticas han sido limpiadas exitosamente.");
}

function GetNumberColor(Num)
{
    // Retorna 'red', 'black' o 'zero'
    if (Num === 0 || Num === "0")
    {
        return "zero";
    }
    if (NumRed[Num])
    {
        return "red";
    }
    return "black";
}

function UpdateColorStreak(CurrentColor)
{
    if (CurrentColor === "zero")
    {
        // El cero termina la secuencia en curso
        if (LastColorStreak.color !== null && LastColorStreak.count > 0)
        {
            var FinalCount = Math.min(LastColorStreak.count, 15);
            ColorStreakCounts[FinalCount]++;
        }
        LastColorStreak.color = null;
        LastColorStreak.count = 0;
    }
    else
    {
        if (LastColorStreak.color === null)
        {
            // Iniciar nueva secuencia
            LastColorStreak.color = CurrentColor;
            LastColorStreak.count = 1;
        }
        else if (LastColorStreak.color === CurrentColor)
        {
            // Mismo color, continuar secuencia
            LastColorStreak.count++;
        }
        else
        {
            // Cambió el color: registrar la secuencia anterior y empezar nueva
            var FinalCount = Math.min(LastColorStreak.count, 15);
            ColorStreakCounts[FinalCount]++;
            
            LastColorStreak.color = CurrentColor;
            LastColorStreak.count = 1;
        }
    }
}

function UpdateStats(WheelNum)
{
    // Asegurar que el número existe en el objeto
    if (NumberStats[WheelNum] === undefined)
    {
        NumberStats[WheelNum] = 0;
    }
    NumberStats[WheelNum]++;
    TotalSpins++;
    SpinCounterForBalance++;
    
    // Actualizar rastreo de secuencia de colores
    var CurrentColor = GetNumberColor(WheelNum);
    UpdateColorStreak(CurrentColor);
    
    // Registrar balances cada 10 jugadas
    if (SpinCounterForBalance >= 10)
    {
        RecordPlayerBalances();
        SpinCounterForBalance = 0;
    }
    
    StatsSave();
}

function RecordPlayerBalances()
{
    // Registrar el balance actual de cada jugador activo (sin eliminar historiales anteriores)
    for (var I = 0; I < GamePlayer_C; I++)
    {
        var PlayerName = GamePlayer_[I].Name;
        if (!PlayerBalanceHistory[PlayerName])
        {
            PlayerBalanceHistory[PlayerName] = [];
        }
        PlayerBalanceHistory[PlayerName].push({
            spins: TotalSpins,
            balance: GamePlayer_[I].Amount
        });
    }
}

function GetTop10Numbers()
{
    var StatsArray = [];
    for (var Num in NumberStats)
    {
        var Count = NumberStats[Num];
        if (Count > 0)
        {
            StatsArray.push({number: parseInt(Num), count: Count});
        }
    }
    
    // Ordenar por frecuencia descendente
    StatsArray.sort(function(a, b) { return b.count - a.count; });
    
    // Devolver los top 10
    return StatsArray.slice(0, 10);
}

function GetColorStats()
{
    var RedCount = 0;
    var BlackCount = 0;
    var ZeroCount = NumberStats[0] || NumberStats["0"] || 0;
    
    for (var I = 1; I <= 36; I++)
    {
        var Count = NumberStats[I] || NumberStats[String(I)] || 0;
        if (Count > 0)
        {
            if (NumRed[I])
            {
                RedCount += Count;
            }
            else
            {
                BlackCount += Count;
            }
        }
    }
    
    return {
        red: RedCount,
        black: BlackCount,
        zero: ZeroCount,
        total: TotalSpins
    };
}

function GetDozenStats()
{
    var First12 = 0;   // 1-12
    var Second12 = 0;  // 13-24
    var Third12 = 0;   // 25-36
    
    for (var I = 1; I <= 36; I++)
    {
        var Count = NumberStats[I] || NumberStats[String(I)] || 0;
        if (Count > 0)
        {
            if (I >= 1 && I <= 12)
            {
                First12 += Count;
            }
            else if (I >= 13 && I <= 24)
            {
                Second12 += Count;
            }
            else if (I >= 25 && I <= 36)
            {
                Third12 += Count;
            }
        }
    }
    
    return {
        first12: First12,
        second12: Second12,
        third12: Third12
    };
}

function GetColumnStats()
{
    var Col1st = 0;   // 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34
    var Col2nd = 0;  // 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35
    var Col3rd = 0;  // 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36
    
    for (var I = 1; I <= 36; I++)
    {
        var Count = NumberStats[I] || NumberStats[String(I)] || 0;
        if (Count > 0)
        {
            var Col = I % 3;
            if (Col === 1)
            {
                Col1st += Count;
            }
            else if (Col === 2)
            {
                Col2nd += Count;
            }
            else if (Col === 0)
            {
                Col3rd += Count;
            }
        }
    }
    
    return {
        col1st: Col1st,
        col2nd: Col2nd,
        col3rd: Col3rd
    };
}

function GetColorStreakStats()
{
    return ColorStreakCounts;
}

function DisplayStats()
{
    // Recargar datos de almacenamiento
    StatsLoad();
    
    // Mostrar el panel de estadísticas
    document.getElementById("StatsScreen").style.display = "block";
    
    console.log("DisplayStats - TotalSpins: " + TotalSpins);
    console.log("DisplayStats - NumberStats: " + Obj2Str(NumberStats));
    
    // Obtener top 10
    var Top10 = GetTop10Numbers();
    console.log("Top10: " + Obj2Str(Top10));
    
    for (var I = 0; I < 10; I++)
    {
        var Row = document.getElementById("StatRow" + I);
        if (I < Top10.length)
        {
            var Item = Top10[I];
            var Percentage = TotalSpins > 0 ? ((Item.count / TotalSpins) * 100).toFixed(2) : 0;
            Row.innerHTML = "<td>" + Item.number + "</td><td>" + Item.count + "</td><td>" + Percentage + "%</td>";
        }
        else
        {
            Row.innerHTML = "<td></td><td></td><td></td>";
        }
    }
    
    // Obtener estadísticas de color
    var ColorStats = GetColorStats();
    console.log("ColorStats: " + Obj2Str(ColorStats));
    
    if (TotalSpins > 0)
    {
        var RedPercent = ((ColorStats.red / TotalSpins) * 100).toFixed(2);
        var BlackPercent = ((ColorStats.black / TotalSpins) * 100).toFixed(2);
        var ZeroPercent = ((ColorStats.zero / TotalSpins) * 100).toFixed(2);
        
        document.getElementById("RedFreq").textContent = ColorStats.red;
        document.getElementById("RedPercent").textContent = RedPercent + "%";
        document.getElementById("BlackFreq").textContent = ColorStats.black;
        document.getElementById("BlackPercent").textContent = BlackPercent + "%";
        document.getElementById("ZeroFreq").textContent = ColorStats.zero;
        document.getElementById("ZeroPercent").textContent = ZeroPercent + "%";
    }
    else
    {
        document.getElementById("RedFreq").textContent = "0";
        document.getElementById("RedPercent").textContent = "0%";
        document.getElementById("BlackFreq").textContent = "0";
        document.getElementById("BlackPercent").textContent = "0%";
        document.getElementById("ZeroFreq").textContent = "0";
        document.getElementById("ZeroPercent").textContent = "0%";
    }
    
    // Obtener estadísticas de docenas
    var DozenStats = GetDozenStats();
    console.log("DozenStats: " + Obj2Str(DozenStats));
    
    if (TotalSpins > 0)
    {
        var First12Percent = ((DozenStats.first12 / TotalSpins) * 100).toFixed(2);
        var Second12Percent = ((DozenStats.second12 / TotalSpins) * 100).toFixed(2);
        var Third12Percent = ((DozenStats.third12 / TotalSpins) * 100).toFixed(2);
        
        document.getElementById("First12Freq").textContent = DozenStats.first12;
        document.getElementById("First12Percent").textContent = First12Percent + "%";
        document.getElementById("Second12Freq").textContent = DozenStats.second12;
        document.getElementById("Second12Percent").textContent = Second12Percent + "%";
        document.getElementById("Third12Freq").textContent = DozenStats.third12;
        document.getElementById("Third12Percent").textContent = Third12Percent + "%";
    }
    else
    {
        document.getElementById("First12Freq").textContent = "0";
        document.getElementById("First12Percent").textContent = "0%";
        document.getElementById("Second12Freq").textContent = "0";
        document.getElementById("Second12Percent").textContent = "0%";
        document.getElementById("Third12Freq").textContent = "0";
        document.getElementById("Third12Percent").textContent = "0%";
    }
    
    // Obtener estadísticas de columnas
    var ColumnStats = GetColumnStats();
    console.log("ColumnStats: " + Obj2Str(ColumnStats));
    
    if (TotalSpins > 0)
    {
        var Col1stPercent = ((ColumnStats.col1st / TotalSpins) * 100).toFixed(2);
        var Col2ndPercent = ((ColumnStats.col2nd / TotalSpins) * 100).toFixed(2);
        var Col3rdPercent = ((ColumnStats.col3rd / TotalSpins) * 100).toFixed(2);
        
        document.getElementById("Col1stFreq").textContent = ColumnStats.col1st;
        document.getElementById("Col1stPercent").textContent = Col1stPercent + "%";
        document.getElementById("Col2ndFreq").textContent = ColumnStats.col2nd;
        document.getElementById("Col2ndPercent").textContent = Col2ndPercent + "%";
        document.getElementById("Col3rdFreq").textContent = ColumnStats.col3rd;
        document.getElementById("Col3rdPercent").textContent = Col3rdPercent + "%";
    }
    else
    {
        document.getElementById("Col1stFreq").textContent = "0";
        document.getElementById("Col1stPercent").textContent = "0%";
        document.getElementById("Col2ndFreq").textContent = "0";
        document.getElementById("Col2ndPercent").textContent = "0%";
        document.getElementById("Col3rdFreq").textContent = "0";
        document.getElementById("Col3rdPercent").textContent = "0%";
    }
    
    // Obtener estadísticas de secuencias de colores
    var ColorStreakStats = GetColorStreakStats();
    console.log("ColorStreakStats: " + Obj2Str(ColorStreakStats));
    
    // Crear copia para contar también el streak en progreso
    var DisplayStreakStats = {};
    for (var I = 1; I <= 15; I++)
    {
        DisplayStreakStats[I] = ColorStreakStats[I] || 0;
    }
    
    // Si hay una secuencia en progreso, incluirla temporalmente para display
    if (LastColorStreak.color !== null && LastColorStreak.count > 0 && LastColorStreak.count <= 15)
    {
        DisplayStreakStats[LastColorStreak.count]++;
    }
    
    // Calcular total de streaks
    var TotalColorStreaks = 0;
    for (var I = 1; I <= 15; I++)
    {
        TotalColorStreaks += (DisplayStreakStats[I] || 0);
    }
    
    // Mostrar secuencias de colores
    for (var I = 1; I <= 15; I++)
    {
        var Count = DisplayStreakStats[I] || 0;
        var Percent = TotalColorStreaks > 0 ? ((Count / TotalColorStreaks) * 100).toFixed(2) : 0;
        var CountElement = document.getElementById("ColorStreak" + I);
        var PercentElement = document.getElementById("ColorStreakPercent" + I);
        if (CountElement)
        {
            CountElement.textContent = Count;
        }
        if (PercentElement)
        {
            PercentElement.textContent = Percent + "%";
        }
    }
    
    // Dibujar gráfico de balances
    DrawPlayerBalanceChart();
}

function DrawPlayerBalanceChart()
{
    // Preparar datos para el gráfico - solo jugadores activos
    var Labels = [];
    var Datasets = [];
    var Colors = ["rgb(255, 99, 132)", "rgb(54, 162, 235)", "rgb(75, 192, 75)", "rgb(255, 206, 86)", "rgb(153, 102, 255)", "rgb(255, 159, 64)"];
    
    // Obtener nombres de jugadores activos actuales
    var ActivePlayerNames = {};
    for (var I = 0; I < GamePlayer_C; I++)
    {
        ActivePlayerNames[GamePlayer_[I].Name] = true;
    }
    
    console.log("DrawPlayerBalanceChart - GamePlayer_C: " + GamePlayer_C);
    console.log("DrawPlayerBalanceChart - ActivePlayerNames: " + Obj2Str(ActivePlayerNames));
    console.log("DrawPlayerBalanceChart - PlayerBalanceHistory: " + Obj2Str(PlayerBalanceHistory));
    
    // Si no hay jugadores activos, mostrar todos los del historial
    var PlayersToShow = ActivePlayerNames;
    if (Object.keys(PlayersToShow).length === 0)
    {
        for (var PlayerName in PlayerBalanceHistory)
        {
            PlayersToShow[PlayerName] = true;
        }
    }
    
    console.log("DrawPlayerBalanceChart - PlayersToShow: " + Obj2Str(PlayersToShow));
    
    // Obtener todos los puntos de spins donde se registraron datos para jugadores a mostrar
    var AllSpinPoints = new Set();
    for (var PlayerName in PlayerBalanceHistory)
    {
        if (!PlayersToShow[PlayerName])
        {
            continue;  // Saltar jugadores que no se muestran
        }
        
        var History = PlayerBalanceHistory[PlayerName];
        for (var I = 0; I < History.length; I++)
        {
            AllSpinPoints.add(History[I].spins);
        }
    }
    
    // Si no hay datos, mostrar mensaje
    if (AllSpinPoints.size === 0)
    {
        var Ctx = document.getElementById("PlayerBalanceChart");
        if (Ctx)
        {
            if (window.PlayerBalanceChartInstance)
            {
                window.PlayerBalanceChartInstance.destroy();
            }
            var CanvasParent = Ctx.parentElement;
            CanvasParent.innerHTML = '<div style="padding:20px;color:#666;">No hay datos de balance disponibles aún</div>';
        }
        return;
    }
    
    // Convertir a array y ordenar
    var SortedSpinPoints = Array.from(AllSpinPoints).sort(function(a, b) { return a - b; });
    
    // Obtener el máximo spin para calcular últimas 30 tiradas
    var MaxSpin = SortedSpinPoints.length > 0 ? SortedSpinPoints[SortedSpinPoints.length - 1] : 0;
    var MinSpinThreshold = MaxSpin - 30;  // Solo mostrar últimas 30 tiradas
    
    console.log("DrawPlayerBalanceChart - MaxSpin: " + MaxSpin + ", MinSpinThreshold: " + MinSpinThreshold);
    
    // Filtrar PlayersToShow para incluir solo jugadores actualizados en las últimas 30 tiradas
    var PlayersToShowFiltered = {};
    for (var PlayerName in PlayersToShow)
    {
        var History = PlayerBalanceHistory[PlayerName];
        var LastSpin = History.length > 0 ? History[History.length - 1].spins : 0;
        
        console.log("Player: " + PlayerName + ", LastSpin: " + LastSpin + ", MinThreshold: " + MinSpinThreshold);
        
        if (LastSpin >= MinSpinThreshold)
        {
            PlayersToShowFiltered[PlayerName] = true;
        }
        else
        {
            // Eliminar jugadores inactivos del historial
            delete PlayerBalanceHistory[PlayerName];
            console.log("Eliminado del historial: " + PlayerName);
        }
    }
    
    // Si no hay jugadores actualizados, mostrar mensaje
    if (Object.keys(PlayersToShowFiltered).length === 0)
    {
        var Ctx = document.getElementById("PlayerBalanceChart");
        if (Ctx)
        {
            if (window.PlayerBalanceChartInstance)
            {
                window.PlayerBalanceChartInstance.destroy();
            }
            var CanvasParent = Ctx.parentElement;
            CanvasParent.innerHTML = '<div style="padding:20px;color:#666;">No hay datos de balance disponibles aún</div>';
        }
        StatsSave();  // Guardar los cambios (jugadores eliminados)
        return;
    }
    
    // Recalcular etiquetas y datasets con solo las últimas 30 tiradas
    var LastSpinPoints = [];
    for (var I = 0; I < SortedSpinPoints.length; I++)
    {
        if (SortedSpinPoints[I] > MinSpinThreshold)
        {
            LastSpinPoints.push(SortedSpinPoints[I]);
        }
    }
    
    // Crear etiquetas con solo las últimas 30 tiradas
    for (var I = 0; I < LastSpinPoints.length; I++)
    {
        Labels.push("Spin " + LastSpinPoints[I]);
    }
    
    // Crear datasets solo para jugadores actualizados recientemente
    var ColorIndex = 0;
    for (var PlayerName in PlayersToShowFiltered)
    {
        var History = PlayerBalanceHistory[PlayerName];
        var Data = [];
        
        for (var I = 0; I < LastSpinPoints.length; I++)
        {
            var SpinPoint = LastSpinPoints[I];
            var Balance = null;
            
            // Buscar el balance en este punto
            for (var J = 0; J < History.length; J++)
            {
                if (History[J].spins === SpinPoint)
                {
                    Balance = History[J].balance;
                    break;
                }
            }
            
            Data.push(Balance);
        }
        
        Datasets.push({
            label: PlayerName,
            data: Data,
            borderColor: Colors[ColorIndex % Colors.length],
            backgroundColor: Colors[ColorIndex % Colors.length].replace("rgb", "rgba").replace(")", ", 0.1)"),
            borderWidth: 2,
            tension: 0.4,
            fill: false
        });
        
        ColorIndex++;
    }
    
    // Destruir gráfico anterior si existe
    if (window.PlayerBalanceChartInstance)
    {
        window.PlayerBalanceChartInstance.destroy();
    }
    
    // Reiniciar el canvas limpiando el padre
    var Ctx = document.getElementById("PlayerBalanceChart");
    if (Ctx)
    {
        var CanvasParent = Ctx.parentElement;
        CanvasParent.innerHTML = '<canvas id="PlayerBalanceChart" height="400"></canvas>';
        Ctx = document.getElementById("PlayerBalanceChart");
    }
    
    // Crear gráfico
    if (Ctx)
    {
        window.PlayerBalanceChartInstance = new Chart(Ctx, {
            type: 'line',
            data: {
                labels: Labels,
                datasets: Datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Balance por Jugador vs Cantidad de Jugadas'
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Balance ($)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Cantidad de Jugadas'
                        }
                    }
                }
            }
        });
    }
}

function StatsClose()
{
    document.getElementById("StatsScreen").style.display = "none";
}

function StatsSave()
{
    DataSet("Roulette_NumberStats", Obj2Str(NumberStats));
    DataSetI("Roulette_TotalSpins", TotalSpins);
    DataSet("Roulette_PlayerBalanceHistory", Obj2Str(PlayerBalanceHistory));
    DataSet("Roulette_ColorStreakCounts", Obj2Str(ColorStreakCounts));
    DataSet("Roulette_LastColorStreak", Obj2Str(LastColorStreak));
    console.log("Stats saved - TotalSpins: " + TotalSpins + ", Stats: " + Obj2Str(NumberStats));
}

function StatsLoad()
{
    var SavedStats = DataGetDefault("Roulette_NumberStats", "{}");
    NumberStats = Str2Obj(SavedStats);
    TotalSpins = DataGetI("Roulette_TotalSpins", 0);
    var SavedBalanceHistory = DataGetDefault("Roulette_PlayerBalanceHistory", "{}");
    PlayerBalanceHistory = Str2Obj(SavedBalanceHistory);
    var SavedColorStreakCounts = DataGetDefault("Roulette_ColorStreakCounts", "{}");
    ColorStreakCounts = Str2Obj(SavedColorStreakCounts);
    var SavedLastColorStreak = DataGetDefault("Roulette_LastColorStreak", "{}");
    LastColorStreak = Str2Obj(SavedLastColorStreak);
    InitStats();
    console.log("Stats loaded - TotalSpins: " + TotalSpins + ", Stats: " + Obj2Str(NumberStats));
}

function StatsClear()
{
    InitStats();
    PlayerBalanceHistory = {};
    SpinCounterForBalance = 0;
    for (var I = 1; I <= 15; I++)
    {
        ColorStreakCounts[I] = 0;
    }
    LastColorStreak = {color: null, count: 0};
    StatsSave();
}
